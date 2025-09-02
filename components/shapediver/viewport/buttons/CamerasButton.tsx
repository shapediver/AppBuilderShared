import {firstLetterUppercase} from "@AppBuilderShared/utils/misc/strings";
import {IViewportApi} from "@shapediver/viewer.viewport";
import React from "react";
import ViewportIconButtonDropdown from "./ViewportIconButtonDropdown";
import {CommonButtonProps} from "./types";

interface CamerasButtonProps extends CommonButtonProps {
	viewport?: IViewportApi;
	visible?: boolean;
}

export default function CamerasButton({
	viewport,
	visible = true,
}: CamerasButtonProps) {
	const cameras = viewport ? viewport.cameras : {};
	const items = Object.values(cameras).map((camera) => ({
		name: firstLetterUppercase(camera.name || camera.id),
		onClick: () => viewport?.assignCamera(camera.id),
	}));

	return (
		<ViewportIconButtonDropdown
			sections={[items]}
			visible={visible}
			viewportIconButtonProps={{
				iconType: "tabler:video",
				label: "Cameras",
			}}
		/>
	);
}
