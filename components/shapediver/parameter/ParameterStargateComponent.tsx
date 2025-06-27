import ParameterLabelComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterLabelComponent";
import ParameterWrapperComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterWrapperComponent";
import Icon, {IconProps} from "@AppBuilderShared/components/ui/Icon";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {useParameterComponentCommons} from "@AppBuilderShared/hooks/shapediver/parameters/useParameterComponentCommons";
import {useStargateParameter} from "@AppBuilderShared/hooks/shapediver/stargate/useStargateParameter";
import {
	defaultPropsParameterWrapper,
	PropsParameter,
	PropsParameterWrapper,
} from "@AppBuilderShared/types/components/shapediver/propsParameter";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {
	ActionIcon,
	ActionIconProps,
	MantineThemeComponent,
	TooltipProps,
	useProps,
} from "@mantine/core";
import React, {useMemo} from "react";
import StargateInput from "../stargate/StargateInput";

interface StyleProps {
	tooltipProps: Partial<TooltipProps>;
	actionIconProps: Partial<ActionIconProps>;
	iconProps: IconProps;
}

const defaultStyleProps: StyleProps = {
	tooltipProps: {
		position: "left",
		label: "Clear selection",
	},
	actionIconProps: {
		size: "lg",
		variant: "transparent",
		loaderProps: {
			type: "dots",
		},
	},
	iconProps: {
		type: IconTypeEnum.Cancel,
		size: "1.2rem",
		color: "var(--mantine-color-default-color)",
	},
};

type ParameterStargateComponentThemePropsType = Partial<StyleProps>;

export function ParameterStargateComponentThemeProps(
	props: ParameterStargateComponentThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

export default function ParameterStargateComponent(
	props: PropsParameter &
		Partial<PropsParameterWrapper> &
		Partial<StyleProps>,
) {
	const {definition, value, handleChange, onCancel, disabled} =
		useParameterComponentCommons<string>(props);

	const {tooltipProps, actionIconProps, iconProps} = useProps(
		"ParameterStargateComponent",
		defaultStyleProps,
		props,
	);

	const {wrapperComponent, wrapperProps} = useProps(
		"ParameterStargateComponent",
		defaultPropsParameterWrapper,
		props,
	);

	const {connectionStatus, onObjectAdd, onClearSelection, isWaiting} =
		useStargateParameter({
			parameterId: definition.id,
			parameterType: definition.type,
			parameterValue: value,
			handleChange,
		});

	const parsedMessage = useMemo(
		() =>
			connectionStatus.message.replace(
				"$1",
				definition.type.substring(1).toLowerCase(),
			),
		[connectionStatus.message, definition.type],
	);

	return (
		<ParameterWrapperComponent
			onCancel={onCancel}
			component={wrapperComponent}
			{...wrapperProps}
		>
			<ParameterLabelComponent
				{...props}
				cancel={onCancel}
				rightSection={
					<TooltipWrapper
						{...tooltipProps}
						label={tooltipProps.label || "Clear selection"}
					>
						<ActionIcon
							style={{visibility: value ? "visible" : "hidden"}}
							color={disabled ? "gray" : connectionStatus.color}
							loading={isWaiting}
							disabled={isWaiting || disabled}
							{...actionIconProps}
							onClick={onClearSelection}
						>
							<Icon {...iconProps} />
						</ActionIcon>
					</TooltipWrapper>
				}
			/>
			{definition && (
				<StargateInput
					message={parsedMessage}
					color={connectionStatus.color}
					isWaiting={isWaiting}
					waitingText="Waiting for selection..."
					isBtnDisabled={connectionStatus.isBtnDisabled || disabled}
					onClick={onObjectAdd}
				/>
			)}
		</ParameterWrapperComponent>
	);
}
