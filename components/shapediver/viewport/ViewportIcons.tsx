import {useViewportControls} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportControls";
import {useViewportId} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportId";
import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {useShapeDiverStoreViewport} from "@AppBuilderShared/store/useShapeDiverStoreViewport";
import {ViewportTransparentBackgroundStyle} from "@AppBuilderShared/types/shapediver/viewport";
import {
	ViewportIconsOptionalProps,
	ViewportIconsProps,
} from "@AppBuilderShared/types/shapediver/viewportIcons";
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
import {IconProps} from "./buttons/types";

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
	enableHistoryButtons: true,
	enableModelStateButtons: true,
	enableImportExportButtons: true,
	enableResetButton: true,
	enableArBtn: true,
	enableCamerasBtn: true,
	enableFullscreenBtn: true,
	enableZoomBtn: true,
	enableHistoryMenuButton: true,
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

export default function ViewportIcons(
	props: ViewportIconsProps & ViewportIconsOptionalProps,
) {
	const {
		viewportId: _viewportId,
		namespace = "",
		hideJsonMenu,
		hideSavedStates,
		...rest
	} = props;

	const {
		style,
		iconStyle,
		fullscreenId,
		enableHistoryButtons,
		enableArBtn,
		enableCamerasBtn,
		enableFullscreenBtn,
		enableZoomBtn,
		enableModelStateButtons: enableModelStateButtonsStyleProp,
		enableImportExportButtons: enableImportExportButtonsStyleProp,
		enableResetButton: enableResetButtonStyleProp,
		enableHistoryMenuButton: enableHistoryMenuButtonStyleProp,
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

	const parameterChanges = useShapeDiverStoreParameters(
		useCallback(
			(state) => {
				if (!namespace) {
					return [];
				}

				const ids = state.sessionDependency[namespace];
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
	const isArEnabled = viewport ? viewport.enableAR : false;

	const ViewerIconsGroup = useMemo(
		() => (
			<>
				{enableArBtn && isArEnabled && (
					<ArButton
						viewport={viewport}
						color={color}
						colorDisabled={colorDisabled}
						variant={variant}
						variantDisabled={variantDisabled}
						size={size}
						iconStyle={iconStyle}
					/>
				)}

				{enableZoomBtn && (
					<ZoomButton
						viewport={viewport}
						color={color}
						variant={variant}
						size={size}
						iconStyle={iconStyle}
					/>
				)}

				{enableFullscreenBtn && (
					<FullscreenButton
						fullscreenId={fullscreenId}
						enableFullscreenBtn={enableFullscreenBtn}
						color={color}
						colorDisabled={colorDisabled}
						variant={variant}
						variantDisabled={variantDisabled}
						size={size}
						iconStyle={iconStyle}
					/>
				)}

				{enableCamerasBtn && (
					<CamerasButton
						viewport={viewport}
						color={color}
						colorDisabled={colorDisabled}
						variant={variant}
						variantDisabled={variantDisabled}
						size={size}
						iconStyle={iconStyle}
						visible={iconsVisible}
					/>
				)}
			</>
		),
		[
			enableArBtn,
			isArEnabled,
			enableZoomBtn,
			enableFullscreenBtn,
			enableCamerasBtn,
			color,
			colorDisabled,
			variant,
			variantDisabled,
			size,
			iconStyle,
			fullscreenId,
			viewport,
			iconsVisible,
		],
	);

	/**
	 * The reset button depends on the following:
	 * - enableResetButtonStyleProp: if false, return false
	 * - hideJsonMenu: if true, return false
	 * otherwise, return true
	 */
	const enableResetButton = useMemo(() => {
		if (enableResetButtonStyleProp === false) return false;
		if (hideJsonMenu) return false;
		return true;
	}, [enableResetButtonStyleProp, hideJsonMenu]);

	/**
	 * The model state buttons depend on the following:
	 * - enableModelStateButtonsStyleProp: if false, return false
	 * - hideSavedStates: if true, return false
	 * otherwise, return true
	 */
	const enableModelStateButtons = useMemo(() => {
		if (enableModelStateButtonsStyleProp === false) return false;
		if (hideSavedStates) return false;
		return true;
	}, [enableModelStateButtonsStyleProp, hideSavedStates]);

	/**
	 * The import/export buttons depend on the following:
	 * - enableImportExportButtonsStyleProp: if false, return false
	 * - hideJsonMenu: if true, return false
	 * otherwise, return true
	 */
	const enableImportExportButtons = useMemo(() => {
		if (enableImportExportButtonsStyleProp === false) return false;
		if (hideJsonMenu) return false;
		return true;
	}, [enableImportExportButtonsStyleProp, hideJsonMenu]);

	/**
	 * The history menu button depends on the following:
	 * - enableHistoryMenuButtonProp: if false, return false
	 * - enableResetButton && enableImportExportButtons & enableModelStateButtons: if all false, return false
	 * - otherwise, return true
	 */
	const enableHistoryMenuButton = useMemo(() => {
		if (enableHistoryMenuButtonStyleProp === false) return false;
		if (
			enableResetButtonStyleProp === false &&
			enableImportExportButtonsStyleProp === false &&
			enableModelStateButtonsStyleProp === false
		) {
			return false;
		}

		return true;
	}, [
		enableHistoryMenuButtonStyleProp,
		enableResetButtonStyleProp,
		enableImportExportButtonsStyleProp,
		enableModelStateButtonsStyleProp,
	]);

	const showHistoryDivider = useMemo(() => {
		const hasViewerIcons =
			(enableArBtn && isArEnabled) ||
			enableZoomBtn ||
			enableFullscreenBtn ||
			enableCamerasBtn;

		const hasHistoryButtons =
			enableHistoryButtons && enableHistoryMenuButton;

		return hasViewerIcons && hasHistoryButtons;
	}, [
		enableArBtn,
		isArEnabled,
		enableZoomBtn,
		enableFullscreenBtn,
		enableCamerasBtn,
		enableHistoryButtons,
		enableHistoryMenuButton,
	]);

	const HistoryButtonsGroup = useMemo(
		() => (
			<>
				{enableHistoryButtons && (
					<>
						<UndoButton
							disabled={buttonsDisabled || executing}
							hasPendingChanges={hasPendingChanges}
							executing={executing}
							color={color}
							colorDisabled={colorDisabled}
							variant={variant}
							variantDisabled={variantDisabled}
							size={size}
							iconStyle={iconStyle}
						/>

						<RedoButton
							disabled={buttonsDisabled || executing}
							hasPendingChanges={hasPendingChanges}
							executing={executing}
							color={color}
							colorDisabled={colorDisabled}
							variant={variant}
							variantDisabled={variantDisabled}
							size={size}
							iconStyle={iconStyle}
						/>
					</>
				)}
				{enableHistoryMenuButton && (
					<HistoryMenuButton
						disabled={!namespace || buttonsDisabled}
						namespace={namespace}
						enableResetButton={enableResetButton}
						enableImportExportButtons={enableImportExportButtons}
						enableModelStateButtons={enableModelStateButtons}
						color={color}
						colorDisabled={colorDisabled}
						variant={variant}
						variantDisabled={variantDisabled}
						size={size}
						iconStyle={iconStyle}
						visible={iconsVisible}
					/>
				)}
			</>
		),
		[
			enableHistoryButtons,
			buttonsDisabled,
			executing,
			hasPendingChanges,
			namespace,
			enableResetButton,
			enableImportExportButtons,
			enableModelStateButtons,
			color,
			colorDisabled,
			variant,
			variantDisabled,
			size,
			iconStyle,
			showControls,
			iconsVisible,
		],
	);

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
						{ViewerIconsGroup}
						{showHistoryDivider && <Divider {...dividerProps} />}
						{HistoryButtonsGroup}
					</Paper>
				)}
			</Transition>
		</ViewportOverlayWrapper>
	);
}
