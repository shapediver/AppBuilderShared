import StargateInput from "@AppBuilderShared/components/ui/stargate/StargateInput";
import {useStargateOutput} from "@AppBuilderShared/hooks/shapediver/stargate/useStargateOutput";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {IShapeDiverOutputDefinition} from "@AppBuilderShared/types/shapediver/output";
import {
	IStargateClientChoice,
	NetworkStatus,
} from "@AppBuilderShared/types/shapediver/stargate";
import type {ISdStargateGetSupportedDataReplyDto} from "@shapediver/sdk.stargate-sdk-v1/dist/dto/commands/getSupportedDataCommand";
import React from "react";
interface Props {
	chunk: NonNullable<IShapeDiverOutputDefinition["chunks"]>[number];
	outputId: IShapeDiverOutputDefinition["id"];
	outputName: IShapeDiverOutputDefinition["name"];
	networkStatus: NetworkStatus;
	supportedData: ISdStargateGetSupportedDataReplyDto[];
	selectedClient?: IStargateClientChoice | null;
	sessionId?: string;
	isLoading: boolean;
	disabled?: boolean;
}

/**
 * Component that handles individual output chunks using Stargate
 */
export default function OutputChunkComponent(props: Props) {
	const {
		chunk,
		outputId,
		networkStatus,
		supportedData,
		selectedClient,
		sessionId,
		isLoading,
		disabled = false,
	} = props;

	// Use stargate output hook for this specific chunk
	const {
		connectionStatus,
		isLoading: isOutputLoading,
		onBakeData,
	} = useStargateOutput({
		chunkId: chunk.id,
		outputId,
		name: chunk.displayname || chunk.name,
		typeHint: chunk.typeHint,
		networkStatus,
		supportedData,
		selectedClient,
		sessionId,
	});

	return (
		<>
			<StargateInput
				message={connectionStatus.message}
				// count={connectionStatus.count} // TODO
				color={connectionStatus.color}
				isLoading={isLoading || isOutputLoading || disabled}
				isBtnDisabled={connectionStatus.isBtnDisabled || disabled}
				icon={IconTypeEnum.DeviceDesktopUp}
				onConnect={onBakeData}
			/>
		</>
	);
}
