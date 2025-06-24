import StargateInput from "@AppBuilderShared/components/shapediver/stargate/StargateInput";
import {useStargateOutput} from "@AppBuilderShared/hooks/shapediver/stargate/useStargateOutput";
import {
	IShapeDiverOutputDefinition,
	IShapeDiverOutputDefinitionChunk,
} from "@AppBuilderShared/types/shapediver/output";
import {
	IStargateClientChoice,
	NetworkStatus,
} from "@AppBuilderShared/types/shapediver/stargate";
import type {ISdStargateGetSupportedDataReplyDto} from "@shapediver/sdk.stargate-sdk-v1/dist/dto/commands/getSupportedDataCommand";
import React from "react";
import OutputChunkLabelComponent from "./OutputChunkLabelComponent";
interface Props {
	output: IShapeDiverOutputDefinition;
	chunk: IShapeDiverOutputDefinitionChunk;
	networkStatus: NetworkStatus;
	supportedData: ISdStargateGetSupportedDataReplyDto[];
	selectedClient?: IStargateClientChoice | null;
	sessionId?: string;
	isLoading: boolean;
}

/**
 * Component that handles individual output chunks using Stargate
 */
export default function OutputChunkComponent(props: Props) {
	const {
		output,
		chunk,
		networkStatus,
		supportedData,
		selectedClient,
		sessionId,
		isLoading,
	} = props;

	// Use stargate output hook for this specific chunk
	const {
		connectionStatus,
		isLoading: isOutputLoading,
		onBakeData,
	} = useStargateOutput({
		chunkId: chunk.id,
		outputId: output.id,
		name: chunk.displayname || chunk.name,
		typeHint: chunk.typeHint,
		networkStatus,
		supportedData,
		selectedClient,
		sessionId,
	});

	return (
		<>
			<OutputChunkLabelComponent chunk={chunk} />
			<StargateInput
				message={connectionStatus.message}
				// count={connectionStatus.count} // TODO
				color={connectionStatus.color}
				isWaiting={isOutputLoading}
				waitingText="Waiting for baking data..."
				isBtnDisabled={connectionStatus.isBtnDisabled || isLoading}
				onClick={onBakeData}
			/>
		</>
	);
}
