import StargateInput from "@AppBuilderShared/components/shapediver/stargate/StargateInput";
import {
	OutputStatusEnum,
	useStargateOutput,
} from "@AppBuilderShared/hooks/shapediver/stargate/useStargateOutput";
import {
	IShapeDiverOutputDefinition,
	IShapeDiverOutputDefinitionChunk,
} from "@AppBuilderShared/types/shapediver/output";
import React, {useMemo} from "react";
import OutputChunkLabelComponent from "./OutputChunkLabelComponent";

interface Props {
	output: IShapeDiverOutputDefinition;
	chunk: IShapeDiverOutputDefinitionChunk;
	sessionId: string;
}

/** Type for data related to the status of the component. */

export type IStatusData = {
	color: string;
	message: string;
	isBtnDisabled: boolean;
};

/**
 * Map from status enum to status data.
 */
const StatusDataMap: {[key in OutputStatusEnum]: IStatusData} = {
	[OutputStatusEnum.notActive]: {
		color: "var(--mantine-color-gray-2)",
		message: "No active client found",
		isBtnDisabled: true,
	},
	[OutputStatusEnum.incompatible]: {
		color: "var(--mantine-color-gray-2)",
		message: "Incompatible output",
		isBtnDisabled: true,
	},
	[OutputStatusEnum.objectAvailableIncompatible]: {
		color: "var(--mantine-color-gray-2)",
		message: "$count $object available (incompatible output)",
		isBtnDisabled: true,
	},
	[OutputStatusEnum.noObjectAvailable]: {
		color: "orange",
		message: "This output is empty",
		isBtnDisabled: true,
	},
	[OutputStatusEnum.objectAvailable]: {
		color: "var(--mantine-primary-color-filled)",
		message: "Bake $count objects",
		isBtnDisabled: false,
	},
	[OutputStatusEnum.objectAvailableNotActive]: {
		color: "var(--mantine-color-gray-2)",
		message: "$count $object available (client not active)",
		isBtnDisabled: true,
	},
	[OutputStatusEnum.unsupported]: {
		color: "orange",
		message: "Unsupported connection status",
		isBtnDisabled: true,
	},
};

/**
 * Component that handles individual output chunks using Stargate
 */
export default function OutputChunkComponent(props: Props) {
	const {output, chunk, sessionId} = props;

	// Use stargate output hook for this specific chunk
	const {isWaiting, onBakeData, status, count} = useStargateOutput({
		chunkId: chunk.id,
		chunkName: chunk.name,
		outputId: output.id,
		typeHint: chunk.typeHint,
		sessionId,
	});

	const statusData = useMemo(() => {
		return StatusDataMap[status];
	}, [status]);

	const parsedMessage = useMemo(() => {
		const msg = statusData.message.replace(
			"$count",
			count ? count + "" : "",
		);
		return msg.replace("$object", count === 1 ? "object" : "objects");
	}, [count, statusData.message]);

	return (
		<>
			<OutputChunkLabelComponent chunk={chunk} />
			<StargateInput
				message={parsedMessage}
				color={statusData.color}
				isWaiting={isWaiting}
				waitingText="Waiting for client..."
				isBtnDisabled={statusData.isBtnDisabled}
				onClick={onBakeData}
			/>
		</>
	);
}
