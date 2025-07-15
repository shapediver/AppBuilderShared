import Icon from "@AppBuilderShared/components/ui/Icon";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {ActionIcon} from "@mantine/core";
import {IViewportApi} from "@shapediver/viewer.viewport";
import React from "react";
import classes from "../ViewportIcons.module.css";
import {CommonButtonProps, IconColor, IconSize, IconVariant} from "./types";

interface ZoomButtonProps extends CommonButtonProps {
	viewport?: IViewportApi;
}

export default function ZoomButton({
	viewport,
	size = IconSize,
	color = IconColor,
	variant = IconVariant,
	iconStyle = {},
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
			>
				<Icon
					type={IconTypeEnum.ZoomIn}
					color={color}
					className={classes.viewportIcon}
				/>
			</ActionIcon>
		</TooltipWrapper>
	);
}
