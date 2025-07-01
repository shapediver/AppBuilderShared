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

/** Type for data related to the status of the component. */
type IStatusData = {
	color: string;
	message: string;
	isBtnDisabled: boolean;
};

/**
 * Map from status enum to status data.
 * TODO SS-8820 colors and messages should be controlled by the theme
 */
const StatusDataMap: {[key in ParameterStatusEnum]: IStatusData} = {
	[ParameterStatusEnum.notActive]: {
		color: "var(--mantine-color-gray-2)",
		message: "No active client found",
		isBtnDisabled: true,
	},
	[ParameterStatusEnum.incompatible]: {
		color: "var(--mantine-color-gray-2)",
		message: "Incompatible input",
		isBtnDisabled: true,
	},
	[ParameterStatusEnum.noObjectSelected]: {
		color: "orange",
		message: "No $type selected",
		isBtnDisabled: false,
	},
	[ParameterStatusEnum.objectSelected]: {
		color: "var(--mantine-primary-color-filled)",
		message: "$count $type selected",
		isBtnDisabled: false,
	},
	[ParameterStatusEnum.unsupported]: {
		color: "orange",
		message: "Unsupported input status",
		isBtnDisabled: true,
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

/**
 * Functional component representing a Stargate parameter (input).
 * @param props
 * @returns
 */
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

	const {status, count, onObjectAdd, onClearSelection, isWaiting} =
		useStargateParameter({
			parameterId: definition.id,
			parameterType: definition.type,
			hasValue: !!value,
			parameterFormat: definition.format,
			handleChange,
		});

	const statusData = useMemo(() => {
		return StatusDataMap[status];
	}, [status]);

	const parsedMessage = useMemo(() => {
		const type_ = definition.type.substring(1).toLowerCase();
		const type = count !== undefined && count > 1 ? type_ + "s" : type_;
		const msg = statusData.message.replace(
			"$count",
			count ? count + "" : "",
		);
		return msg.replace("$type", type);
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
					disabled={statusData.isBtnDisabled || disabled}
					onClick={onObjectAdd}
					icon={IconTypeEnum.DeviceDesktopDown}
				/>
			)}
		</ParameterWrapperComponent>
	);
}
