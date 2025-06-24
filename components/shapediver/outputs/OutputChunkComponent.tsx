import StargateInput from "@AppBuilderShared/components/shapediver/stargate/StargateInput";
import {useStargateOutput} from "@AppBuilderShared/hooks/shapediver/stargate/useStargateOutput";
import {
	IShapeDiverOutputDefinition,
	IShapeDiverOutputDefinitionChunk,
} from "@AppBuilderShared/types/shapediver/output";
import React from "react";
import OutputChunkLabelComponent from "./OutputChunkLabelComponent";
interface Props {
	output: IShapeDiverOutputDefinition;
	chunk: IShapeDiverOutputDefinitionChunk;
	sessionId?: string;
}

/**
 * Component that handles individual output chunks using Stargate
 */
export default function OutputChunkComponent(props: Props) {
	const {output, chunk, sessionId} = props;

	// Use stargate output hook for this specific chunk
	const {connectionStatus, isWaiting, isLoading, onBakeData} =
		useStargateOutput({
			chunkId: chunk.id,
			outputId: output.id,
			name: chunk.displayname || chunk.name,
			typeHint: chunk.typeHint,
			sessionId,
		});

	return (
		<>
			<OutputChunkLabelComponent chunk={chunk} />
			<StargateInput
				message={connectionStatus.message}
				// count={connectionStatus.count} // TODO
				color={connectionStatus.color}
				isWaiting={isWaiting}
				waitingText="Waiting for client..."
				isBtnDisabled={connectionStatus.isBtnDisabled || isLoading}
				onClick={onBakeData}
			/>
		</>
	);
}
