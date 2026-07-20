import {
	legacyViewportIconsDefaultDividerProps,
	legacyViewportIconsDefaultStyleProps,
	legacyViewportIconsDefaultTransitionProps,
} from "@AppBuilderLib/entities/viewport/config/legacyViewportIconsTheme";
import {ButtonRenderContext} from "@AppBuilderLib/features/appbuilder/config/componentTypes";
import {ToolbarRegistration} from "@AppBuilderLib/features/appbuilder/config/shapediverStoreToolbars";
import {Divider, Paper, Transition, useProps} from "@mantine/core";
import React, {useCallback, useEffect, useMemo, useState} from "react";
import {useToolbarVisibility} from "../model/useToolbarVisibility";
import AppBuilderToolbarButton from "./AppBuilderToolbarButton";

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

interface Props {
	toolbar: ToolbarRegistration;
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
	const [openedPopoverId, setOpenedPopoverId] = useState<string>();
	useEffect(() => {
		setMenuOpen(!!openedPopoverId);
	}, [openedPopoverId, setMenuOpen]);

	useEffect(() => {
		if (!openedPopoverId) return;

		const closeOnViewportPointerDown = (
			event: PointerEvent | MouseEvent | TouchEvent,
		) => {
			if (event.target instanceof HTMLCanvasElement) {
				setOpenedPopoverId(undefined);
			}
		};

		document.addEventListener(
			"pointerdown",
			closeOnViewportPointerDown,
			true,
		);
		document.addEventListener(
			"mousedown",
			closeOnViewportPointerDown,
			true,
		);
		document.addEventListener(
			"touchstart",
			closeOnViewportPointerDown,
			true,
		);

		return () => {
			document.removeEventListener(
				"pointerdown",
				closeOnViewportPointerDown,
				true,
			);
			document.removeEventListener(
				"mousedown",
				closeOnViewportPointerDown,
				true,
			);
			document.removeEventListener(
				"touchstart",
				closeOnViewportPointerDown,
				true,
			);
		};
	}, [openedPopoverId]);

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
							return (
								<AppBuilderToolbarButton
									key={popoverId}
									toolbarItem={toolbarItem}
									buttonRenderContext={
										resolvedButtonRenderContext
									}
									defaultIcon={toolbar.defaultIcon}
									toolbarSide={toolbar.side}
									popoverId={popoverId}
									openedPopoverId={openedPopoverId}
									onPopoverOpenChange={
										handlePopoverOpenChange
									}
								/>
							);
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
