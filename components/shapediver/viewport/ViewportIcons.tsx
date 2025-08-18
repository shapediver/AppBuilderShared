import {useViewportControls} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportControls";
import {useViewportId} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportId";
import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {useShapeDiverStoreViewport} from "@AppBuilderShared/store/useShapeDiverStoreViewport";
import {useShapeDiverViewportIconsStore} from "@AppBuilderShared/store/useShapeDiverViewportIconsStore";
import {ViewportTransparentBackgroundStyle} from "@AppBuilderShared/types/shapediver/viewport";
import {
	ViewportIconsOptionalProps,
	ViewportIconsProps,
} from "@AppBuilderShared/types/shapediver/viewportIcons";
import {ViewportIconButtonType} from "@AppBuilderShared/types/store/shapediverStoreViewportIcons";
import {Divider, Paper, Transition, useProps} from "@mantine/core";
import React, {useCallback, useMemo, useState} from "react";
import {useShallow} from "zustand/react/shallow";
import {OverlayPosition} from "~/shared/components/shapediver/ui/OverlayWrapper";
import ViewportOverlayWrapper from "./ViewportOverlayWrapper";
import ArButton from "./buttons/ArButton";
import CamerasButton from "./buttons/CamerasButton";
import FullscreenButton from "./buttons/FullscreenButton";
import HistoryMenuButton from "./buttons/HistoryMenuButton";
import RedoButton from "./buttons/RedoButton";
import UndoButton from "./buttons/UndoButton";
import ZoomButton from "./buttons/ZoomButton";
import {CommonButtonProps, IconProps} from "./buttons/types";

const defaultStyleProps: ViewportIconsOptionalProps = {
	style: {
		display: "flex",
		gap: "0.25rem",
		alignItems: "center",
		flexDirection: "row",
		border: "none",
		...ViewportTransparentBackgroundStyle,
	},
	fullscreenId: "viewer-fullscreen-area",
	color: undefined,
	colorDisabled: undefined,
	variant: IconProps.variant,
	variantDisabled: IconProps.variantDisabled,
	size: IconProps.size,
	iconStyle: {
		m: "0.188rem",
	},
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

interface ButtonRenderContext extends CommonButtonProps {
	viewport?: any;
	namespace?: string;
	buttonsDisabled: boolean;
	executing: boolean;
	hasPendingChanges: boolean;
	iconsVisible: boolean;
	fullscreenId: string;
}

function renderButtonByKind(
	kind: ViewportIconButtonType,
	context: ButtonRenderContext,
): React.ReactNode {
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
		case ViewportIconButtonType.Ar:
			return <ArButton key="ar" viewport={viewport} {...commonProps} />;
		case ViewportIconButtonType.Zoom:
			return (
				<ZoomButton key="zoom" viewport={viewport} {...commonProps} />
			);
		case ViewportIconButtonType.Fullscreen:
			return (
				<FullscreenButton
					key="fullscreen"
					fullscreenId={fullscreenId}
					enableFullscreenBtn={true}
					{...commonProps}
				/>
			);
		case ViewportIconButtonType.Cameras:
			return (
				<CamerasButton
					key="cameras"
					viewport={viewport}
					visible={iconsVisible}
					{...commonProps}
				/>
			);
		case ViewportIconButtonType.Undo:
			return (
				<UndoButton
					key="undo"
					disabled={buttonsDisabled || executing}
					hasPendingChanges={hasPendingChanges}
					executing={executing}
					{...commonProps}
				/>
			);
		case ViewportIconButtonType.Redo:
			return (
				<RedoButton
					key="redo"
					disabled={buttonsDisabled || executing}
					hasPendingChanges={hasPendingChanges}
					executing={executing}
					{...commonProps}
				/>
			);
		case ViewportIconButtonType.HistoryMenu:
			return (
				<HistoryMenuButton
					key="historyMenu"
					disabled={!namespace || buttonsDisabled}
					namespace={namespace || ""}
					visible={iconsVisible}
					{...commonProps}
				/>
			);
		default:
			return null;
	}
}

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

	const {viewportIcons} = useShapeDiverViewportIconsStore(
		useShallow((state) => ({
			viewportIcons:
				viewportId && state.viewports[viewportId]
					? state.viewports[viewportId].layout
					: [],
		})),
	);

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

	// Render layout items dynamically
	const dynamicContent = useMemo(() => {
		const sections: React.ReactNode[] = [];

		viewportIcons.forEach((item, index) => {
			if (item.type === "button") {
				const button = renderButtonByKind(
					item.button.type,
					buttonContext,
				);
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
							<Divider
								key={`divider-${index}-${section.length}`}
								{...dividerProps}
							/>,
						);
					}
				});
				sections.push(
					<React.Fragment key={`group-${index}`}>
						{groupButtons}
					</React.Fragment>,
				);
			}

			// Add divider between layout items
			if (index < viewportIcons.length - 1) {
				sections.push(
					<Divider
						key={`layout-divider-${index}`}
						{...dividerProps}
					/>,
				);
			}
		});

		return sections;
	}, [viewportIcons, buttonContext, dividerProps]);

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
						{dynamicContent}
					</Paper>
				)}
			</Transition>
		</ViewportOverlayWrapper>
	);
}
