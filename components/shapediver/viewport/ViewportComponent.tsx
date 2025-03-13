import {useViewport} from "@AppBuilderShared/hooks/shapediver/viewer/useViewport";
import AlertPage from "@AppBuilderShared/pages/misc/AlertPage";
import {
	ViewportBrandingProps,
	ViewportComponentProps,
} from "@AppBuilderShared/types/shapediver/viewport";
import {useComputedColorScheme, useProps} from "@mantine/core";
import React from "react";
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
	if (!_props.branding) _props.branding = brandingProps[scheme];

	const {canvasRef, error} = useViewport(_props);

	return error ? (
		<AlertPage title="Error">{error.message}</AlertPage>
	) : (
		<div className={`${classes.container} ${className}`}>
			<canvas ref={canvasRef} />
			{children}
		</div>
	);
}
