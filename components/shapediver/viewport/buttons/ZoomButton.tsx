import {IViewportApi} from "@shapediver/viewer.viewport";
import React from "react";
import {CommonButtonProps} from "./types";
import ViewportIconButton from "./ViewportIconButton";

interface ZoomButtonProps extends CommonButtonProps {
	viewport?: IViewportApi;
}

export default function ZoomButton({viewport}: ZoomButtonProps) {
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
				iconType="tabler:zoom-in"
				label="Zoom extents"
				onClick={onZoomClick}
			/>
		</div>
	);
}
