import {ViewportTransparentBackgroundStyle} from "@AppBuilderShared/types/shapediver/viewport";
import {firstLetterUppercase} from "@AppBuilderShared/utils/misc/strings";
import {MenuDropdownProps} from "@mantine/core";
import {IViewportApi} from "@shapediver/viewer.viewport";
import React from "react";
import ViewportIconButtonDropdown from "./ViewportIconButtonDropdown";
import {CommonButtonProps, IconProps} from "./types";

interface CamerasButtonProps extends CommonButtonProps {
	viewport?: IViewportApi;
	menuDropdownProps?: MenuDropdownProps;
	visible?: boolean;
}

export default function CamerasButton({
	viewport,
	size = undefined,
	color = IconProps.color,
	colorDisabled = IconProps.colorDisabled,
	variant = IconProps.variant,
	variantDisabled = IconProps.variantDisabled,
	iconStyle = IconProps.style,
	menuDropdownProps = {
		style: ViewportTransparentBackgroundStyle,
	},
	visible = true,
}: CamerasButtonProps) {
	const cameras = viewport ? viewport.cameras : {};
	const items = Object.values(cameras).map((camera) => ({
		name: firstLetterUppercase(camera.name || camera.id),
		onClick: () => viewport?.assignCamera(camera.id),
	}));

	return (
		<ViewportIconButtonDropdown
			iconType={"tabler:video"}
			tooltip="Cameras"
			sections={[items]}
			menuDropdownProps={menuDropdownProps}
			visible={visible}
			size={size}
			color={color}
			colorDisabled={colorDisabled}
			variant={variant}
			variantDisabled={variantDisabled}
			iconStyle={iconStyle}
		/>
	);
}
