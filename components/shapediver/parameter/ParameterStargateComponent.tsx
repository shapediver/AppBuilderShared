import ParameterLabelComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterLabelComponent";
import ParameterWrapperComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterWrapperComponent";
import Icon, {IconProps} from "@AppBuilderShared/components/ui/Icon";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {useParameterComponentCommons} from "@AppBuilderShared/hooks/shapediver/parameters/useParameterComponentCommons";
import {
	ParameterStatusEnum,
	useStargateParameter,
} from "@AppBuilderShared/hooks/shapediver/stargate/useStargateParameter";
import {
	defaultPropsParameterWrapper,
	PropsParameter,
	PropsParameterWrapper,
} from "@AppBuilderShared/types/components/shapediver/propsParameter";
import {
	IStargateComponentStatusDefinition,
	mapStargateComponentStatusDefinition,
	StargateStatusColorTypeEnum,
} from "@AppBuilderShared/types/shapediver/stargate";
import {
	ActionIcon,
	ActionIconProps,
	MantineThemeComponent,
	TooltipProps,
	useProps,
} from "@mantine/core";
import React, {useMemo} from "react";
import StargateInput from "../stargate/StargateInput";
import {
	DefaultStargateStyleProps,
	StargateStyleProps,
} from "../stargate/stargateShared";

/**
 * Map from status enum to status data.
 */
const StatusDataMap: {
	[key in ParameterStatusEnum]: IStargateComponentStatusDefinition;
} = {
	[ParameterStatusEnum.notActive]: {
		colorType: StargateStatusColorTypeEnum.dimmed,
		message: "No active client found",
		disabled: true,
	},
	[ParameterStatusEnum.incompatible]: {
		colorType: StargateStatusColorTypeEnum.dimmed,
		message: "Incompatible input",
		disabled: true,
	},
	[ParameterStatusEnum.noObjectSelected]: {
		colorType: StargateStatusColorTypeEnum.focused,
		message: "No $type_l selected",
		disabled: false,
	},
	[ParameterStatusEnum.objectSelected]: {
		colorType: StargateStatusColorTypeEnum.primary,
		message: "$type_u selected $count",
		disabled: false,
	},
	[ParameterStatusEnum.unsupported]: {
		colorType: StargateStatusColorTypeEnum.dimmed,
		message: "Unsupported input status",
		disabled: true,
	},
};

interface StyleProps {
	tooltipProps: Partial<TooltipProps>;
	actionIconProps: Partial<ActionIconProps>;
	iconProps: IconProps;
}

const defaultStyleProps: StyleProps = {
	tooltipProps: {
		position: "top",
		label: "Clear selection",
	},
	actionIconProps: {
		size: "1.5rem",
		variant: "transparent",
		loaderProps: {
			type: "dots",
		},
	},
	iconProps: {
		iconType: "tabler:x",
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

/**
 * Functional component representing a Stargate parameter (input).
 * @param props
 * @returns
 */
export default function ParameterStargateComponent(
	props: PropsParameter &
		Partial<PropsParameterWrapper> &
		Partial<StyleProps> &
		Partial<StargateStyleProps>,
) {
	const {definition, value, handleChange, onCancel, disabled} =
		useParameterComponentCommons<string>(props);

	const {tooltipProps, actionIconProps, iconProps, ...rest} = useProps(
		"ParameterStargateComponent",
		defaultStyleProps,
		props,
	);

	const {wrapperComponent, wrapperProps} = useProps(
		"ParameterStargateComponent",
		defaultPropsParameterWrapper,
		rest,
	);

	const {stargateColorProps} = useProps(
		"StargateShared",
		DefaultStargateStyleProps,
		rest,
	);

	const {status, count, onObjectAdd, onClearSelection, isWaiting} =
		useStargateParameter({
			parameterId: definition.id,
			parameterType: definition.type,
			hasValue: !!value,
			parameterFormat: definition.format,
			handleChange,
			increaseReferenceCount: true,
		});

	const statusData = useMemo(() => {
		return mapStargateComponentStatusDefinition(
			StatusDataMap[status],
			stargateColorProps,
		);
	}, [status, stargateColorProps]);

	const parsedMessage = useMemo(() => {
		const type_ = definition.type.substring(1);
		const type = count !== undefined && count > 1 ? type_ + "s" : type_;
		const msg = statusData.message.replace(
			"$count",
			count ? `(${count})` : "",
		);
		return msg
			.replace("$type_u", type)
			.replace("$type_l", type_.toLowerCase());
	}, [count, statusData.message, definition.type]);

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
					onCancel ? undefined : (
						<TooltipWrapper
							{...tooltipProps}
							label={tooltipProps.label || "Clear selection"}
						>
							<ActionIcon
								style={{
									visibility: value ? "visible" : "hidden",
								}}
								color={disabled ? "gray" : statusData.color}
								loading={isWaiting}
								disabled={isWaiting || disabled}
								{...actionIconProps}
								onClick={onClearSelection}
							>
								<Icon {...iconProps} />
							</ActionIcon>
						</TooltipWrapper>
					)
				}
			/>
			{definition && (
				<StargateInput
					message={parsedMessage}
					color={statusData.color}
					isWaiting={isWaiting}
					waitingText="Waiting for selection..."
					disabled={statusData.disabled || disabled}
					onClick={onObjectAdd}
					icon={"tabler:device-desktop-up"}
				/>
			)}
		</ParameterWrapperComponent>
	);
}
