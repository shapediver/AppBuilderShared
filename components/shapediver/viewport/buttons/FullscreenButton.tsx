import Icon from "@AppBuilderShared/components/ui/Icon";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {useFullscreen} from "@AppBuilderShared/hooks/ui/useFullscreen";
import {ActionIcon} from "@mantine/core";
import React from "react";
import {isIPhone} from "~/shared/utils/misc/navigator";
import classes from "../ViewportIcons.module.css";
import {CommonButtonProps, IconProps} from "./types";

interface FullscreenButtonProps extends CommonButtonProps {
	fullscreenId?: string;
	enableFullscreenBtn?: boolean;
}

export default function FullscreenButton({
	fullscreenId = "viewer-fullscreen-area",
	enableFullscreenBtn = true,
	color = IconProps.color,
	colorDisabled = IconProps.colorDisabled,
	size = undefined,
	variant = IconProps.variant,
	variantDisabled = IconProps.variantDisabled,
	iconStyle = IconProps.style,
}: FullscreenButtonProps) {
	const isFullscreenDisabled = !enableFullscreenBtn || isIPhone();
	const {makeElementFullscreen, isFullScreenAvailable} =
		useFullscreen(fullscreenId);
	const disabled = isFullscreenDisabled || !isFullScreenAvailable.current;

	return (
		<TooltipWrapper label="Fullscreen">
			<ActionIcon
				onClick={makeElementFullscreen}
				disabled={disabled}
				size={size}
				variant={disabled ? variantDisabled : variant}
				aria-label="Fullscreen"
				style={iconStyle}
				className={classes.ViewportIcon}
			>
				<Icon
					iconType={"tabler:maximize"}
					color={disabled ? colorDisabled : color}
				/>
			</ActionIcon>
		</TooltipWrapper>
	);
}
