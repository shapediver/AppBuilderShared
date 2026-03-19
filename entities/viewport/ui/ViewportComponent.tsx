import {ViewportControlsVisibilityContext} from "@AppBuilderLib/shared/lib/ViewportControlsVisibilityContext";
import AlertPage from "@AppBuilderShared/pages/misc/AlertPage";
import {useComputedColorScheme, useProps} from "@mantine/core";
import {
	SESSION_SETTINGS_MODE,
	VISIBILITY_MODE,
} from "@shapediver/viewer.session";
import React from "react";
import {useShallow} from "zustand/react/shallow";
import {
	ViewportBrandingProps,
	ViewportComponentProps,
} from "../config/viewport";
import {useShapeDiverViewportIconsStore} from "../model/useShapeDiverViewportIconsStore";
import {useViewport} from "../model/useViewport";
import {useViewportControlsVisibility} from "../model/useViewportControlsVisibility";
import classes from "./ViewportComponent.module.css";

/**
 * Functional component that creates a canvas in which a viewport with the specified properties is loaded.
 *
 * @returns
 */
export default function ViewportComponent(props: ViewportComponentProps) {
	const {children = <></>, className = "", ...rest} = props;
	const _props = useProps("ViewportComponent", {}, rest);

	const brandingProps = useProps(
		"ViewportBranding",
		{},
		{},
	) as ViewportBrandingProps;
	const scheme = useComputedColorScheme();
	const {showControls, containerProps, setIsHoveringControls} =
		useViewportControlsVisibility();

	// Get viewer fullscreen state from store
	const viewerFullscreen3States = useShapeDiverViewportIconsStore(
		useShallow((state) => state.viewerFullscreen3States),
	);
	if (!_props.branding) _props.branding = brandingProps[scheme];
	if (!_props.sessionSettingsMode) {
		_props.sessionSettingsMode = SESSION_SETTINGS_MODE.MANUAL;
		_props.sessionSettingsId = "default";
	}
	if (
		!_props.visibility &&
		_props.visibilitySessionIds &&
		_props.visibilitySessionIds.length > 0
	) {
		_props.visibility = VISIBILITY_MODE.SESSIONS;
	}

	const {canvasRef, error} = useViewport(_props);

	return error ? (
		<AlertPage title="Error">{error.message}</AlertPage>
	) : (
		<ViewportControlsVisibilityContext.Provider
			value={{showControls, setIsHoveringControls}}
		>
			<div
				className={`${classes.container} ${className} ${viewerFullscreen3States ? classes.viewerFullscreen3States : ""}`}
				{...containerProps}
			>
				<canvas ref={canvasRef} />
				{children}
			</div>
		</ViewportControlsVisibilityContext.Provider>
	);
}
