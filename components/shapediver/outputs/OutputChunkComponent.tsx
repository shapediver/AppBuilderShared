import StargateInput from "@AppBuilderShared/components/shapediver/stargate/StargateInput";
import {ExportInterceptorContext} from "@AppBuilderShared/context/ExportInterceptorContext";
import {
	OutputStatusEnum,
	useStargateOutput,
} from "@AppBuilderShared/hooks/shapediver/stargate/useStargateOutput";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {
	IShapeDiverOutputDefinition,
	IShapeDiverOutputDefinitionChunk,
} from "@AppBuilderShared/types/shapediver/output";
import {
	IStargateComponentStatusDefinition,
	mapStargateComponentStatusDefinition,
	StargateStatusColorTypeEnum,
} from "@AppBuilderShared/types/shapediver/stargate";
import {useProps} from "@mantine/core";
import React, {useContext, useMemo} from "react";
import {
	DefaultStargateStyleProps,
	StargateStyleProps,
} from "../stargate/stargateShared";
import OutputChunkLabelComponent from "./OutputChunkLabelComponent";

interface Props {
	output: IShapeDiverOutputDefinition;
	chunk: IShapeDiverOutputDefinitionChunk;
	sessionId: string;
}

/**
 * Map from status enum to status data.
 */
const StatusDataMap: {
	[key in OutputStatusEnum]: IStargateComponentStatusDefinition;
} = {
	[OutputStatusEnum.notActive]: {
		colorType: StargateStatusColorTypeEnum.dimmed,
		message: "No active client found",
		disabled: true,
	},
	[OutputStatusEnum.incompatible]: {
		colorType: StargateStatusColorTypeEnum.dimmed,
		message: "Incompatible output",
		disabled: true,
	},
	[OutputStatusEnum.objectAvailableIncompatible]: {
		colorType: StargateStatusColorTypeEnum.dimmed,
		message: "Incompatible output $count",
		disabled: true,
	},
	[OutputStatusEnum.noObjectAvailable]: {
		colorType: StargateStatusColorTypeEnum.focused,
		message: "This output is empty",
		disabled: true,
	},
	[OutputStatusEnum.objectAvailable]: {
		colorType: StargateStatusColorTypeEnum.primary,
		message: "Bake in the active client $count",
		disabled: false,
	},
	[OutputStatusEnum.objectAvailableNotActive]: {
		colorType: StargateStatusColorTypeEnum.dimmed,
		message: "Client not active $count",
		disabled: true,
	},
	[OutputStatusEnum.unsupported]: {
		colorType: StargateStatusColorTypeEnum.dimmed,
		message: "Unsupported connection status",
		disabled: true,
	},
};

/**
 * Component that handles individual output chunks using Stargate
 */
export default function OutputChunkComponent(
	props: Props & Partial<StargateStyleProps>,
) {
	const {output, chunk, sessionId, ...rest} = props;

	const {stargateColorProps} = useProps(
		"StargateShared",
		DefaultStargateStyleProps,
		rest,
	);

	// Use stargate output hook for this specific chunk
	const {isWaiting, onBakeData, status, count} = useStargateOutput({
		chunkId: chunk.id,
		chunkName: chunk.name,
		outputId: output.id,
		typeHint: chunk.typeHint,
		sessionId,
	});

	// get optional distribution-specific click interceptor and right section from context
	const {interceptClick, rightSection} = useContext(ExportInterceptorContext);

	const statusData = useMemo(() => {
		return mapStargateComponentStatusDefinition(
			StatusDataMap[status],
			stargateColorProps,
		);
	}, [status, stargateColorProps]);

	const parsedMessage = useMemo(() => {
		const msg = statusData.message.replace(
			"$count",
			count ? `(${count})` : "",
		);
		return msg.replace("$object", count === 1 ? "object" : "objects");
	}, [count, statusData.message]);

	return (
		<>
			<OutputChunkLabelComponent
				chunk={chunk}
				rightSection={rightSection}
			/>
			<StargateInput
				icon={IconTypeEnum.DeviceDesktopDown}
				message={parsedMessage}
				color={statusData.color}
				isWaiting={isWaiting}
				waitingText="Waiting for client..."
				disabled={statusData.disabled}
				onClick={
					interceptClick
						? () => interceptClick(onBakeData)
						: onBakeData
				}
			/>
		</>
	);
}
