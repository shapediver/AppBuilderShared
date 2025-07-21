import Icon from "@AppBuilderShared/components/ui/Icon";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {ActionIcon} from "@mantine/core";
import React from "react";
import {useViewportHistory} from "~/shared/hooks/shapediver/viewer/useViewportHistory";
import classes from "../ViewportIcons.module.css";
import {CommonButtonProps, IconProps} from "./types";

interface RedoButtonProps extends CommonButtonProps {
	disabled: boolean;
	hasPendingChanges: boolean;
	executing: boolean;
}

export default function RedoButton({
	disabled,
	hasPendingChanges,
	executing,
	size = undefined,
	color = IconProps.color,
	colorDisabled = IconProps.colorDisabled,
	variant = IconProps.variant,
	variantDisabled = IconProps.variantDisabled,
	iconStyle = IconProps.style,
}: RedoButtonProps) {
	const {canGoForward, goForward} = useViewportHistory();
	const isDisabled = !canGoForward || disabled || executing;

	return (
		<TooltipWrapper
			label={
				hasPendingChanges ? "Accept or reject changes first" : "Redo"
			}
		>
			<ActionIcon
				onClick={goForward}
				disabled={isDisabled}
				size={size}
				variant={isDisabled ? variantDisabled : variant}
				aria-label="Redo"
				style={iconStyle}
			>
				<Icon
					type={IconTypeEnum.ArrowForwardUp}
					color={isDisabled ? colorDisabled : color}
					className={classes.viewportIcon}
				/>
			</ActionIcon>
		</TooltipWrapper>
	);
}
