import Icon from "@AppBuilderShared/components/ui/Icon";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {ActionIcon} from "@mantine/core";
import React from "react";
import classes from "../ViewportIcons.module.css";
import {CommonButtonProps, IconProps} from "./types";

interface ViewportIconButtonProps extends CommonButtonProps {
	iconType: string;
	tooltip?: string;
	disabled?: boolean;
	onClick?: () => void;
}

export default function ViewportIconButton({
	iconType,
	tooltip,
	disabled = false,
	onClick,
	size = undefined,
	color = IconProps.color,
	colorDisabled = IconProps.colorDisabled,
	variant = IconProps.variant,
	variantDisabled = IconProps.variantDisabled,
	iconStyle = IconProps.style,
}: ViewportIconButtonProps) {
	return (
		<TooltipWrapper label={tooltip ?? ""}>
			<ActionIcon
				onClick={onClick}
				disabled={disabled}
				size={size}
				variant={disabled ? variantDisabled : variant}
				aria-label={tooltip ?? "Button"}
				style={iconStyle}
				className={classes.ViewportIcon}
			>
				<Icon
					iconType={iconType}
					color={disabled ? colorDisabled : color}
				/>
			</ActionIcon>
		</TooltipWrapper>
	);
}
