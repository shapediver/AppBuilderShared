import {IViewportApi} from "@shapediver/viewer.viewport";
import React from "react";
import {CommonButtonProps, IconProps} from "./types";
import ViewportIconButton from "./ViewportIconButton";

interface ZoomButtonProps extends CommonButtonProps {
	viewport?: IViewportApi;
}

export default function ZoomButton({
	viewport,
	size = undefined,
	color = IconProps.color,
	variant = IconProps.variant,
	iconStyle = IconProps.style,
}: ZoomButtonProps) {
	const onZoomClick = () => {
		if (!viewport || !viewport.camera) return;
		viewport.camera.zoomTo();
	};

	const onZoomDoubleClick = () => {
		if (!viewport || !viewport.camera) return;
		viewport.camera.reset({});
	};

	return (
		<div onDoubleClick={onZoomDoubleClick}>
			<ViewportIconButton
				iconType={"tabler:zoom-in"}
				onClick={onZoomClick}
				size={size}
				color={color}
				variant={variant}
				iconStyle={iconStyle}
				tooltip="Zoom extents"
			/>
		</div>
	);
}
