import Icon from "@AppBuilderShared/components/ui/Icon";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {useFullscreen} from "@AppBuilderShared/hooks/ui/useFullscreen";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {ActionIcon} from "@mantine/core";
import React from "react";
import {isIPhone} from "~/shared/utils/misc/navigator";
import classes from "../ViewportIcons.module.css";
import {
	CommonButtonProps,
	IconColor,
	IconColorDisabled,
	IconVariant,
	IconVariantDisabled,
} from "./types";

interface FullscreenButtonProps extends CommonButtonProps {
	fullscreenId?: string;
	enableFullscreenBtn?: boolean;
}

export default function FullscreenButton({
	fullscreenId = "viewer-fullscreen-area",
	enableFullscreenBtn = true,
	size = undefined,
	color = IconColor,
	colorDisabled = IconColorDisabled,
	variant = IconVariant,
	variantDisabled = IconVariantDisabled,
	iconStyle = {},
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
			>
				<Icon
					type={IconTypeEnum.Maximize}
					color={disabled ? colorDisabled : color}
					className={classes.viewportIcon}
				/>
			</ActionIcon>
		</TooltipWrapper>
	);
}
