import Icon from "@AppBuilderShared/components/ui/Icon";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {ActionIcon} from "@mantine/core";
import React from "react";
import {useViewportHistory} from "~/shared/hooks/shapediver/viewer/useViewportHistory";
import {CommonButtonProps, IconProps} from "./types";

interface UndoButtonProps extends CommonButtonProps {
	disabled: boolean;
	hasPendingChanges: boolean;
	executing: boolean;
}

export default function UndoButton({
	disabled,
	hasPendingChanges,
	executing,
	size = undefined,
	color = IconProps.color,
	colorDisabled = IconProps.colorDisabled,
	variant = IconProps.variant,
	variantDisabled = IconProps.variantDisabled,
	iconStyle = IconProps.style,
}: UndoButtonProps) {
	const {canGoBack, goBack} = useViewportHistory();
	const isDisabled = !canGoBack || disabled || executing;

	return (
		<TooltipWrapper
			label={
				hasPendingChanges ? "Accept or reject changes first" : "Undo"
			}
		>
			<ActionIcon
				onClick={goBack}
				disabled={isDisabled}
				size={size}
				variant={isDisabled ? variantDisabled : variant}
				aria-label="Undo"
				style={iconStyle}
			>
				<Icon
					type={IconTypeEnum.ArrowBackUp}
					color={isDisabled ? colorDisabled : color}
				/>
			</ActionIcon>
		</TooltipWrapper>
	);
}
