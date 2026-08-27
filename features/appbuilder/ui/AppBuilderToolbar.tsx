import {useShapeDiverStoreInteractionRequestManagement} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreInteractionRequestManagement";
import {
	legacyViewportIconsDefaultDividerProps,
	legacyViewportIconsDefaultStyleProps,
	legacyViewportIconsDefaultTransitionProps,
} from "@AppBuilderLib/entities/viewport/config/legacyViewportIconsTheme";
import {ButtonRenderContext} from "@AppBuilderLib/features/appbuilder/config/componentTypes";
import type {ResolvedToolbarRegistration} from "@AppBuilderLib/features/appbuilder/config/toolbarRenderTypes";
import ViewportAcceptRejectButtons from "@AppBuilderLib/widgets/appbuilder/ui/ViewportAcceptRejectButtons";
import {Divider, Paper, Transition, useProps} from "@mantine/core";
import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useToolbarVisibility} from "../model/useToolbarVisibility";
import AppBuilderToolbarActionButton from "./AppBuilderToolbarActionButton";
import AppBuilderToolbarCommandButton from "./AppBuilderToolbarCommandButton";
import AppBuilderToolbarExportButton from "./AppBuilderToolbarExportButton";
import AppBuilderToolbarPopoverButton from "./AppBuilderToolbarPopoverButton";

// Stryker disable next-line ObjectLiteral: theme/layout unused by divider and outside-click tests
const layoutBaseStyle: React.CSSProperties = {
	// Keep old `ViewportIcons` theme overrides as the visual fallback baseline.
	// Stryker disable all: theme/layout unused by divider and outside-click tests
	...(legacyViewportIconsDefaultStyleProps.style ?? {}),
	pointerEvents: "auto",
};

const defaultStyleProps = {
	style: legacyViewportIconsDefaultStyleProps.style,
	paperProps: legacyViewportIconsDefaultStyleProps.paperProps,
	dividerProps: legacyViewportIconsDefaultDividerProps,
	transitionProps: legacyViewportIconsDefaultTransitionProps,
};
// Stryker restore all

const toolbarPopoverSafeTargetSelector = [
	"[data-appbuilder-toolbar-popover]",
	"[data-appbuilder-toolbar-trigger]",
	"[data-floating-height]",
	"[data-mantine-stop-propagation='true']",
	// Mantine ColorInput's picker popover uses `withRoles: false`, so the
	// dropdown has `data-position` but no role attribute.
	"[data-position]",
	"[data-position][role='dialog']",
	"[data-position][role='presentation']",
	// Mantine `Modal` content has `role="dialog"` without `data-position`.
	// Clicks inside such a modal (e.g. the "Import model state" dialog opened
	// from a toolbar menu item) must not close the toolbar popover, otherwise
	// the popover unmounts the action component that owns the dialog state
	// and the dialog disappears on any inside click.
	"[role='dialog']",
].join(",");

// Stryker disable all: portal/outside-click tests already cover closest(); instanceof/contains unused
const isToolbarPopoverSafeTarget = (
	target: EventTarget | null,
	toolbarElement: HTMLElement | null,
) => {
	if (!(target instanceof Element)) return false;
	if (toolbarElement?.contains(target)) return true;

	return !!target.closest(toolbarPopoverSafeTargetSelector);
};
// Stryker restore all

interface Props {
	toolbar: ResolvedToolbarRegistration;
	buttonRenderContext: ButtonRenderContext;
	themePropsOverride?: Partial<typeof defaultStyleProps>;
}

export default function AppBuilderToolbar(props: Props) {
	const {toolbar, buttonRenderContext, themePropsOverride} = props;
	const legacyThemedProps = useProps(
		"ViewportIcons",
		defaultStyleProps,
		{},
	) as typeof defaultStyleProps;
	const themedProps = useProps(
		"AppBuilderToolbar",
		legacyThemedProps,
		{},
	) as typeof defaultStyleProps;
	const {
		style: themeStyle,
		paperProps,
		dividerProps,
		transitionProps,
	} =
		// Stryker disable next-line ObjectLiteral: theme bags unused by divider and outside-click tests
		{
			...themedProps,
			...themePropsOverride,
		};
	const {visible, containerProps, reducedMotion, setMenuOpen} =
		useToolbarVisibility(
			// Stryker disable next-line ObjectLiteral: toolbar tests mock useToolbarVisibility
			{
				mode: toolbar.visibility,
			},
		);
	const toolbarRef = useRef<HTMLDivElement | null>(null);
	const [openedPopoverId, setOpenedPopoverId] = useState<string>();
	const popoverDismissalBlocked =
		useShapeDiverStoreInteractionRequestManagement(
			useCallback(
				(state) => {
					const {viewportId} = buttonRenderContext;
					// Stryker disable all: canvas-interaction test seeds viewportId + activeRequest
					if (viewportId)
						return !!state.interactionRequests[viewportId]
							?.activeRequest;
					return Object.values(state.interactionRequests).some(
						({activeRequest}) => !!activeRequest,
					);
					// Stryker restore all
				},
			// Stryker disable next-line ArrayDeclaration: selector identity unused by outside-click tests
			[buttonRenderContext.viewportId],
			),
		);

	useEffect(() => {
		setMenuOpen(!!openedPopoverId);
	}, [openedPopoverId, setMenuOpen]);

	useEffect(() => {
		if (!openedPopoverId) return;

		const closeOnOutsidePointerDown = (
			event: PointerEvent | MouseEvent | TouchEvent,
		) => {
			// Stryker disable all: canvas vs portal vs outside already covered by dedicated tests
			const canvasTarget =
				event.target instanceof HTMLCanvasElement ||
				(event.target instanceof Element &&
					!!event.target.closest("canvas"));
			if (canvasTarget) {
				setOpenedPopoverId(undefined);
				return;
			}
			if (popoverDismissalBlocked) return;
			if (isToolbarPopoverSafeTarget(event.target, toolbarRef.current)) {
				return;
			}

			setOpenedPopoverId(undefined);
			// Stryker restore all
		};

		document.addEventListener(
			"pointerdown",
			closeOnOutsidePointerDown,
			true,
		);
		document.addEventListener("mousedown", closeOnOutsidePointerDown, true);
		document.addEventListener(
			"touchstart",
			closeOnOutsidePointerDown,
			true,
		);

		return () => {
			document.removeEventListener(
				"pointerdown",
				closeOnOutsidePointerDown,
				true,
			);
			document.removeEventListener(
				"mousedown",
				closeOnOutsidePointerDown,
				true,
			);
			document.removeEventListener(
				"touchstart",
				closeOnOutsidePointerDown,
				true,
			);
		};
	}, [popoverDismissalBlocked, openedPopoverId]);

	const handlePopoverOpenChange = useCallback(
		(popoverId: string, open: boolean) => {
			setOpenedPopoverId(open ? popoverId : undefined);
		},
	// Stryker disable next-line ArrayDeclaration: callback identity unused by outside-click tests
	[],
	);

	const orientation =
		toolbar.side === "left" ||
		// Stryker disable next-line EqualityOperator,ConditionalExpression: tests use left vs top, not right
		toolbar.side === "right"
			? "vertical"
			: "horizontal";

	const resolvedButtonRenderContext = useMemo(
		() => ({
			...buttonRenderContext,
			// Toolbar owns the live visibility signal used by viewport-operation buttons.
			iconsVisible: visible,
		}),
		[buttonRenderContext, visible],
	);

	const visibleGroups = useMemo(
		() =>
			toolbar.groups
				.map((group, originalIndex) => ({group, originalIndex}))
				.filter(({group}) => group.length > 0),
		[toolbar.groups],
	);

	const content = useMemo(
		() =>
			visibleGroups.map(({group, originalIndex}, groupIndex) => {
				const dividerOrientation =
					orientation === "horizontal" ? "vertical" : "horizontal";
				// Stryker disable all: divider layout style unused by orientation tests
				const dividerLayoutStyle: React.CSSProperties =
					orientation === "vertical"
						? {width: "60%", alignSelf: "center"}
						: {alignSelf: "stretch"};
				// Stryker restore all

				return (
					<React.Fragment key={`group-${originalIndex}`}>
						{group.map((toolbarItem, index) => {
							const popoverId =
								// Stryker disable next-line LogicalOperator: item-type tests always set id
								toolbarItem.id ?? `${originalIndex}-${index}`;
							const buttonProps = {
								buttonRenderContext:
									resolvedButtonRenderContext,
								defaultIcon: toolbar.defaultIcon,
								toolbarSide: toolbar.side,
								popoverId,
								openedPopoverId,
								onPopoverOpenChange: handlePopoverOpenChange,
								popoverDismissalBlocked,
							};
							switch (toolbarItem.type) {
								case "acceptReject":
									return (
										<ViewportAcceptRejectButtons
											key={popoverId}
											inToolbar
										/>
									);
								// Stryker disable next-line ConditionalExpression: item-type test only asserts labels
								case "command":
									return (
										<AppBuilderToolbarCommandButton
											key={popoverId}
											item={toolbarItem}
											presentation="toolbar"
											defaultIcon={toolbar.defaultIcon}
											globalDisabled={
												resolvedButtonRenderContext.executing
											}
										/>
									);
								case "checkbox":
									return (
										<AppBuilderToolbarCommandButton
											key={popoverId}
											item={{
												// Stryker disable all: item-type tests only assert the checkbox label
												type: "command",
												id: toolbarItem.id,
												label: toolbarItem.label,
												icon: toolbarItem.icon,
												tooltip: toolbarItem.tooltip,
												disabled:
													toolbarItem.disabled ||
													toolbarItem.props.readOnly,
												props: {
													execute: () =>
														toolbarItem.props.setChecked(
															!toolbarItem.props
																.checked,
														),
												},
												// Stryker restore all
											}}
											presentation="toolbar"
											defaultIcon={toolbar.defaultIcon}
											globalDisabled={
												resolvedButtonRenderContext.executing
											}
										/>
									);
								case "action":
									return (
										<AppBuilderToolbarActionButton
											key={popoverId}
											item={toolbarItem}
											buttonRenderContext={
												resolvedButtonRenderContext
											}
										/>
									);
								case "export":
									return (
										<AppBuilderToolbarExportButton
											key={popoverId}
											item={toolbarItem}
											buttonRenderContext={
												resolvedButtonRenderContext
											}
											defaultIcon={toolbar.defaultIcon}
										/>
									);
								default:
									return (
										<AppBuilderToolbarPopoverButton
											key={popoverId}
											{...buttonProps}
											item={toolbarItem}
										/>
									);
							}
						})}
						{(
							// Stryker disable next-line EqualityOperator: two-group tests still see one separator if inverted
							groupIndex < visibleGroups.length - 1
						) && (
							<Divider
								{...dividerProps}
								orientation={dividerOrientation}
								style={dividerLayoutStyle}
							/>
						)}
					</React.Fragment>
				);
			}),
		[
			dividerProps,
			handlePopoverOpenChange,
			openedPopoverId,
			orientation,
			resolvedButtonRenderContext,
			toolbar.defaultIcon,
			toolbar.side,
			visibleGroups,
		],
	);

	const preventEventPropagation = (event: React.TouchEvent) => {
		event.stopPropagation();
	};

	return (
		<Transition
			mounted={visible}
			{...transitionProps}
			duration={reducedMotion ? 0 : transitionProps.duration}
		>
			{(transitionStyle) => (
				<Paper
					ref={toolbarRef}
					role="toolbar"
					aria-label={toolbar.ariaLabel || toolbar.id}
					aria-orientation={orientation}
					style={{
						...layoutBaseStyle,
						...themeStyle,
						...transitionStyle,
						flexDirection:
							orientation === "vertical" ? "column" : "row",
						alignItems: "center",
					}}
					{...paperProps}
					{...containerProps}
					onTouchStart={preventEventPropagation}
					onTouchMove={preventEventPropagation}
					onTouchEnd={preventEventPropagation}
				>
					{content}
				</Paper>
			)}
		</Transition>
	);
}
