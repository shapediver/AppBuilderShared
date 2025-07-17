import Icon from "@AppBuilderShared/components/ui/Icon";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {ActionIcon} from "@mantine/core";
import React from "react";
import {useViewportHistory} from "~/shared/hooks/shapediver/viewer/useViewportHistory";
import {
	CommonButtonProps,
	IconColor,
	IconColorDisabled,
	IconVariant,
	IconVariantDisabled,
} from "./types";

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
	color = IconColor,
	colorDisabled = IconColorDisabled,
	variant = IconVariant,
	variantDisabled = IconVariantDisabled,
	iconStyle = {},
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
				/>
			</ActionIcon>
		</TooltipWrapper>
	);
}
