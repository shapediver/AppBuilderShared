import {OverlayPosition} from "@AppBuilderShared/components/shapediver/ui/OverlayWrapper";
import {useViewportControls} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportControls";
import {useViewportId} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportId";
import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {useShapeDiverStoreViewport} from "@AppBuilderShared/store/useShapeDiverStoreViewport";
import {useShapeDiverViewportIconsStore} from "@AppBuilderShared/store/useShapeDiverViewportIconsStore";
import {ButtonRenderContext} from "@AppBuilderShared/types/components/shapediver/componentTypes";
import {ViewportTransparentBackgroundStyle} from "@AppBuilderShared/types/shapediver/viewport";
import {
	ViewportIconsOptionalProps,
	ViewportIconsProps,
} from "@AppBuilderShared/types/shapediver/viewportIcons";
import {
	Divider,
	DividerProps,
	Paper,
	Transition,
	useProps,
} from "@mantine/core";
import React, {useCallback, useMemo, useState} from "react";
import {useShallow} from "zustand/react/shallow";
import {ViewportTypeToIcon} from "~/shared/context/ComponentContext";
import {
	ViewportIconButtonEnum,
	ViewportIconLayoutItem,
} from "~/shared/types/store/shapediverStoreViewportIcons";
import ViewportOverlayWrapper from "./ViewportOverlayWrapper";

export const defaultStyleProps: ViewportIconsOptionalProps = {
	style: {
		display: "flex",
		gap: "0.25rem",
		alignItems: "center",
		flexDirection: "row",
		border: "none",
		...ViewportTransparentBackgroundStyle,
	},
	fullscreenId: "viewer-fullscreen-area",
	viewportOverlayProps: {
		position: OverlayPosition.TOP_MIDDLE,
		offset: "0.5em",
	},
	paperProps: {
		py: 1,
		px: 0,
		shadow: "md",
	},
	dividerProps: {
		orientation: "vertical",
		color: "var(--mantine-color-disabled-color)",
	},
	transitionProps: {
		transition: "fade-down",
		duration: 400,
		timingFunction: "ease",
		keepMounted: true,
	},
};

const renderButtonByKind = (kind: ViewportIconButtonEnum, context: any) => {
	const {
		viewport,
		namespace,
		buttonsDisabled,
		executing,
		hasPendingChanges,
		iconsVisible,
		fullscreenId,
		...commonProps
	} = context;

	switch (kind) {
		case ViewportIconButtonEnum.Ar:
			return React.createElement(
				ViewportTypeToIcon[ViewportIconButtonEnum.Ar],
				{key: "ar", viewport, ...commonProps},
			);
		case ViewportIconButtonEnum.Zoom:
			return React.createElement(
				ViewportTypeToIcon[ViewportIconButtonEnum.Zoom],
				{key: "zoom", viewport, ...commonProps},
			);
		case ViewportIconButtonEnum.Fullscreen:
			return React.createElement(
				ViewportTypeToIcon[ViewportIconButtonEnum.Fullscreen],
				{
					key: "fullscreen",
					fullscreenId,
					enableFullscreenBtn: true,
					...commonProps,
				},
			);
		case ViewportIconButtonEnum.Cameras:
			return React.createElement(
				ViewportTypeToIcon[ViewportIconButtonEnum.Cameras],
				{
					key: "cameras",
					viewport,
					visible: iconsVisible,
					...commonProps,
				},
			);
		case ViewportIconButtonEnum.Undo:
			return React.createElement(
				ViewportTypeToIcon[ViewportIconButtonEnum.Undo],
				{
					key: "undo",
					disabled: buttonsDisabled || executing || hasPendingChanges,
					hasPendingChanges,
					executing,
					...commonProps,
				},
			);
		case ViewportIconButtonEnum.Redo:
			return React.createElement(
				ViewportTypeToIcon[ViewportIconButtonEnum.Redo],
				{
					key: "redo",
					disabled: buttonsDisabled || executing || hasPendingChanges,
					hasPendingChanges,
					executing,
					...commonProps,
				},
			);
		case ViewportIconButtonEnum.Reload:
			return React.createElement(
				ViewportTypeToIcon[ViewportIconButtonEnum.Reload],
				{
					key: "reload",
					disabled:
						!namespace ||
						buttonsDisabled ||
						executing ||
						hasPendingChanges,
					namespace: namespace || "",
					hasPendingChanges,
					executing,
					...commonProps,
				},
			);
		case ViewportIconButtonEnum.HistoryMenu:
			return React.createElement(
				ViewportTypeToIcon[ViewportIconButtonEnum.HistoryMenu],
				{
					key: "historyMenu",
					disabled:
						!namespace || buttonsDisabled || hasPendingChanges,
					namespace: namespace || "",
					visible: iconsVisible,
					...commonProps,
				},
			);
		default:
			return null;
	}
};

const renderViewportIcons = (
	viewportIcons: ViewportIconLayoutItem[],
	buttonContext: ButtonRenderContext,
	dividerProps: DividerProps = {},
) => {
	const sections: React.ReactNode[] = [];
	if (viewportIcons.length === 0) return sections;

	viewportIcons.forEach((item, index) => {
		if (item.type === "button") {
			const button = renderButtonByKind(item.button.type, buttonContext);
			if (button) sections.push(button);
		} else if (item.type === "group") {
			const groupButtons: React.ReactNode[] = [];
			item.sections.forEach((section) => {
				section.forEach((buttonDef) => {
					const button = renderButtonByKind(
						buttonDef.type,
						buttonContext,
					);
					if (button) groupButtons.push(button);
				});
				// Add divider between sections within a group
				if (
					groupButtons.length > 0 &&
					section !== item.sections[item.sections.length - 1]
				) {
					groupButtons.push(
						React.createElement(Divider, {
							key: `divider-${index}-${section.length}`,
							...dividerProps,
						}),
					);
				}
			});
			sections.push(
				React.createElement(
					React.Fragment,
					{key: `group-${index}`},
					...groupButtons,
				),
			);
		}

		// Add divider between layout items
		if (index < viewportIcons.length - 1) {
			sections.push(
				React.createElement(Divider, {
					key: `layout-divider-${index}`,
					...dividerProps,
				}),
			);
		}
	});

	return sections;
};

export default function ViewportIcons(
	props: ViewportIconsProps & ViewportIconsOptionalProps,
) {
	const {
		viewportId: _viewportId,
		namespace = "",
		hideJsonMenu,
		...rest
	} = props;

	const {
		style,
		iconStyle,
		fullscreenId,
		color,
		colorDisabled,
		variant,
		variantDisabled,
		size,
		viewportOverlayProps,
		paperProps,
		dividerProps,
		transitionProps,
	} = useProps("ViewportIcons", defaultStyleProps, rest);

	const {viewportId: defaultViewportId} = useViewportId();
	const [iconsVisible, setIconsVisible] = useState(true);
	const viewportId = _viewportId ?? defaultViewportId;
	const viewport = useShapeDiverStoreViewport(
		useShallow((state) => state.viewports[viewportId]),
	);
	const {showControls, setIsHoveringControls} = useViewportControls();

	const layout =
		useShapeDiverViewportIconsStore(
			useShallow((state) => state.viewportIcons[viewportId]?.layout),
		) ?? [];

	const parameterChanges = useShapeDiverStoreParameters(
		useCallback(
			(state) => {
				if (!namespace) {
					return [];
				}

				const ids = state.sessionDependency[namespace];
				if (ids === undefined || ids.length === 0) {
					return [];
				}

				return ids
					.map((id) => state.parameterChanges[id])
					.filter(Boolean);
			},
			[namespace],
		),
	);

	const executing = useMemo(
		() => parameterChanges.some((change) => change.executing),
		[parameterChanges],
	);

	const hasPendingChanges = useMemo(
		() =>
			parameterChanges.length > 0 &&
			parameterChanges.some((c) => Object.keys(c.values).length > 0),
		[parameterChanges],
	);

	const buttonsDisabled = hasPendingChanges;
	/**
	 * The reset button depends on the following:
	 * - enableResetButtonStyleProp: if false, return false
	 * - hideJsonMenu: if true, return false
	 * otherwise, return true
	 */
	const enableResetButton = useMemo(() => {
		if (hideJsonMenu) return false;
		return true;
	}, [hideJsonMenu]);

	/**
	 * The model state buttons depend on the following:
	 * - enableModelStateButtonsStyleProp: if false, return false
	 * - hideJsonMenu: if true, return false
	 * otherwise, return true
	 */
	const enableModelStateButtons = useMemo(() => {
		if (hideJsonMenu) return false;
		return true;
	}, [hideJsonMenu]);

	/**
	 * The import/export buttons depend on the following:
	 * - enableImportExportButtonsStyleProp: if false, return false
	 * - hideJsonMenu: if true, return false
	 * otherwise, return true
	 */
	const enableImportExportButtons = useMemo(() => {
		if (hideJsonMenu) return false;
		return true;
	}, [hideJsonMenu]);

	// Create button render context
	const buttonContext: ButtonRenderContext = useMemo(
		() => ({
			viewport,
			namespace,
			buttonsDisabled,
			executing,
			hasPendingChanges,
			iconsVisible,
			enableResetButton,
			enableImportExportButtons,
			enableModelStateButtons,
			fullscreenId: fullscreenId || "viewer-fullscreen-area",
			color,
			colorDisabled,
			variant,
			variantDisabled,
			size,
			iconStyle,
		}),
		[
			viewport,
			namespace,
			buttonsDisabled,
			executing,
			hasPendingChanges,
			iconsVisible,
			enableResetButton,
			enableImportExportButtons,
			enableModelStateButtons,
			fullscreenId,
			color,
			colorDisabled,
			variant,
			variantDisabled,
			size,
			iconStyle,
		],
	);

	const content = useMemo(() => {
		return renderViewportIcons(layout, buttonContext, dividerProps);
	}, [layout, buttonContext, dividerProps]);

	// Prevent event propagation to avoid triggering viewport interactions
	// when touching the icons.
	const preventEventPropagation = (e: React.TouchEvent) => {
		e.stopPropagation();
	};

	return (
		<ViewportOverlayWrapper {...viewportOverlayProps}>
			<Transition
				mounted={showControls}
				{...transitionProps}
				onEntered={() => setIconsVisible(true)}
				onExit={() => setIconsVisible(false)}
			>
				{(styles) => (
					<Paper
						style={{...style, ...styles}}
						{...paperProps}
						onTouchStart={preventEventPropagation}
						onTouchMove={preventEventPropagation}
						onTouchEnd={preventEventPropagation}
						onMouseLeave={() => setIsHoveringControls(false)}
						onMouseEnter={() => setIsHoveringControls(true)}
					>
						{content}
					</Paper>
				)}
			</Transition>
		</ViewportOverlayWrapper>
	);
}
