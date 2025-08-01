import Icon from "@AppBuilderShared/components/ui/Icon";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {ActionIcon} from "@mantine/core";
import {IViewportApi} from "@shapediver/viewer.viewport";
import React from "react";
import classes from "../ViewportIcons.module.css";
import {CommonButtonProps, IconProps} from "./types";

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
		<TooltipWrapper label="Zoom extents">
			<ActionIcon
				onClick={onZoomClick}
				onDoubleClick={onZoomDoubleClick}
				size={size}
				variant={variant}
				aria-label="Zoom extents"
				style={iconStyle}
				className={classes.ViewportIcon}
			>
				<Icon type={IconTypeEnum.ZoomIn} color={color} />
			</ActionIcon>
		</TooltipWrapper>
	);
}
