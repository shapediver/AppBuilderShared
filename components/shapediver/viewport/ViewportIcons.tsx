import {useViewportId} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportId";
import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {useShapeDiverStoreViewport} from "@AppBuilderShared/store/useShapeDiverStoreViewport";
import {
	ViewportIconsOptionalProps,
	ViewportIconsProps,
} from "@AppBuilderShared/types/shapediver/viewportIcons";
import {Paper, useProps} from "@mantine/core";
import React, {useCallback, useMemo} from "react";
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
	color: IconProps.color,
	colorDisabled: IconProps.colorDisabled,
	variant: IconProps.variant,
	variantDisabled: IconProps.variantDisabled,
	size: IconProps.size,
	iconStyle: {m: "0.188rem"},
	viewportOverlayProps: {
		position: OverlayPosition.TOP_MIDDLE,
		offset: "0.5em",
	},
	paperProps: {
		py: 1,
		px: 0,
		shadow: "md",
	},
};

export default function ViewportIcons(
	props: ViewportIconsProps & ViewportIconsOptionalProps,
) {
	const {viewportId: _viewportId, namespace = "", ...rest} = props;

	const {
		style,
		iconStyle,
		fullscreenId,
		enableHistoryButtons,
		enableModelStateButtons,
		enableImportExportButtons,
		enableResetButton,
		enableArBtn,
		enableCamerasBtn,
		enableFullscreenBtn,
		enableZoomBtn,
		color,
		colorDisabled,
		variant,
		variantDisabled,
		size,
		viewportOverlayProps,
		paperProps,
	} = useProps("ViewportIcons", defaultStyleProps, rest);

	const {viewportId: defaultViewportId} = useViewportId();
	const viewportId = _viewportId ?? defaultViewportId;
	const viewport = useShapeDiverStoreViewport(
		useShallow((state) => state.viewports[viewportId]),
	);

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

	return (
		<ViewportOverlayWrapper {...viewportOverlayProps}>
			<Paper style={style} {...paperProps}>
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
					/>
				)}

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
				/>
			</Paper>
		</ViewportOverlayWrapper>
	);
}
