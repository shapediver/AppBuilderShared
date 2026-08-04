import {useShapeDiverStoreInteractionRequestManagement} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreInteractionRequestManagement";
import {
	legacyViewportIconsDefaultDividerProps,
	legacyViewportIconsDefaultStyleProps,
	legacyViewportIconsDefaultTransitionProps,
} from "@AppBuilderLib/entities/viewport/config/legacyViewportIconsTheme";
import {ButtonRenderContext} from "@AppBuilderLib/features/appbuilder/config/componentTypes";
import type {ResolvedToolbarRegistration} from "@AppBuilderLib/features/appbuilder/config/toolbarRenderTypes";
import {Divider, Paper, Transition, useProps} from "@mantine/core";
import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useToolbarVisibility} from "../model/useToolbarVisibility";
import AppBuilderToolbarActionButton from "./AppBuilderToolbarActionButton";
import AppBuilderToolbarCommandButton from "./AppBuilderToolbarCommandButton";
import AppBuilderToolbarExportButton from "./AppBuilderToolbarExportButton";
import AppBuilderToolbarPopoverButton from "./AppBuilderToolbarPopoverButton";

const layoutBaseStyle: React.CSSProperties = {
	// Keep old `ViewportIcons` theme overrides as the visual fallback baseline.
	...(legacyViewportIconsDefaultStyleProps.style ?? {}),
	pointerEvents: "auto",
};

const defaultStyleProps = {
	style: legacyViewportIconsDefaultStyleProps.style,
	paperProps: legacyViewportIconsDefaultStyleProps.paperProps,
	dividerProps: legacyViewportIconsDefaultDividerProps,
	transitionProps: legacyViewportIconsDefaultTransitionProps,
};

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
].join(",");

const isToolbarPopoverSafeTarget = (
	target: EventTarget | null,
	toolbarElement: HTMLElement | null,
) => {
	if (!(target instanceof Element)) return false;
	if (toolbarElement?.contains(target)) return true;

	return !!target.closest(toolbarPopoverSafeTargetSelector);
};

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
	} = {
		...themedProps,
		...themePropsOverride,
	};
	const {visible, containerProps, reducedMotion, setMenuOpen} =
		useToolbarVisibility({
			mode: toolbar.visibility,
		});
	const toolbarRef = useRef<HTMLDivElement | null>(null);
	const [openedPopoverId, setOpenedPopoverId] = useState<string>();
	const popoverDismissalBlocked =
		useShapeDiverStoreInteractionRequestManagement(
			useCallback(
				(state) => {
					const {viewportId} = buttonRenderContext;
					if (viewportId)
						return !!state.interactionRequests[viewportId]
							?.activeRequest;
					return Object.values(state.interactionRequests).some(
						({activeRequest}) => !!activeRequest,
					);
				},
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
		[],
	);

	const orientation =
		toolbar.side === "left" || toolbar.side === "right"
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
				const dividerLayoutStyle: React.CSSProperties =
					orientation === "vertical"
						? {width: "60%", alignSelf: "center"}
						: {alignSelf: "stretch"};

				return (
					<React.Fragment key={`group-${originalIndex}`}>
						{group.map((toolbarItem, index) => {
							const popoverId =
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
								case "command":
									return (
										<AppBuilderToolbarCommandButton
											key={popoverId}
											item={toolbarItem}
											presentation="toolbar"
											defaultIcon={toolbar.defaultIcon}
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
						{groupIndex < visibleGroups.length - 1 && (
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
