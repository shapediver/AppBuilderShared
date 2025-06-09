import ParameterLabelComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterLabelComponent";
import ParameterWrapperComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterWrapperComponent";
import Icon from "@AppBuilderShared/components/ui/Icon";
import StargateInput from "@AppBuilderShared/components/ui/stargate/StargateInput";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {useParameterComponentCommons} from "@AppBuilderShared/hooks/shapediver/parameters/useParameterComponentCommons";
import {useStargateConnection} from "@AppBuilderShared/hooks/shapediver/stargate/useStargateConnection";
import {useStargateParameter} from "@AppBuilderShared/hooks/shapediver/stargate/useStargateParameter";
import {useShapeDiverStoreStargate} from "@AppBuilderShared/store/useShapeDiverStoreStargate";
import {
	defaultPropsParameterWrapper,
	PropsParameter,
	PropsParameterWrapper,
} from "@AppBuilderShared/types/components/shapediver/propsParameter";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {ActionIcon, useProps} from "@mantine/core";
import React from "react";

export default function ParameterStargateComponent(
	props: PropsParameter & Partial<PropsParameterWrapper>,
) {
	const {definition, value, handleChange, onCancel, disabled} =
		useParameterComponentCommons<string>(props);

	const {wrapperComponent, wrapperProps} = useProps(
		"ParameterStargateComponent",
		defaultPropsParameterWrapper,
		props,
	);

	const {networkStatus, isLoading, selectedClient} =
		useShapeDiverStoreStargate();

	const {supportedData} = useStargateConnection();

	const {
		connectionStatus,
		onObjectAdd,
		onClearSelection,
		isLoading: isParameterLoading,
	} = useStargateParameter({
		parameterId: definition.id,
		parameterType: definition.type,
		parameterValue: value,
		parameterDefval: definition.defval,
		networkStatus,
		supportedData,
		selectedClient,
		onChange: (newValue) => handleChange(newValue),
	});

	const parsedMessage =
		connectionStatus.message && definition.type
			? connectionStatus.message.replace(
					"$1",
					definition.type.substring(1).toLowerCase(),
				)
			: connectionStatus.message;

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
					<TooltipWrapper position="left" label="Clear selection">
						<ActionIcon
							size="lg"
							variant="transparent"
							style={{visibility: value ? "visible" : "hidden"}}
							color={disabled ? "gray" : connectionStatus.color}
							loading={isLoading || isParameterLoading}
							loaderProps={{type: "dots"}}
							disabled={
								isLoading || isParameterLoading || disabled
							}
							onClick={onClearSelection}
						>
							<Icon type={IconTypeEnum.Cancel} size="1.2rem" />
						</ActionIcon>
					</TooltipWrapper>
				}
			/>
			{definition && (
				<StargateInput
					message={parsedMessage}
					color={connectionStatus.color}
					isLoading={isLoading}
					isBtnDisabled={
						connectionStatus.isBtnDisabled ||
						disabled ||
						isParameterLoading
					}
					isClearSelection={connectionStatus.isClearSelection}
					icon={IconTypeEnum.DeviceDesktopUp}
					onConnect={onObjectAdd}
				/>
			)}
		</ParameterWrapperComponent>
	);
}
