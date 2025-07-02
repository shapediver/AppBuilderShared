import {NotificationContext} from "@AppBuilderShared/context/NotificationContext";
import {useShapeDiverStorePlatform} from "@AppBuilderShared/store/useShapeDiverStorePlatform";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {useShapeDiverStoreStargate} from "@AppBuilderShared/store/useShapeDiverStoreStargate";
import {IShapeDiverOutputDefinition} from "@AppBuilderShared/types/shapediver/output";
import {NetworkStatus} from "@AppBuilderShared/types/shapediver/stargate";
import {exceptionWrapperAsync} from "@AppBuilderShared/utils/exceptionWrapper";
import {getParameterStates} from "@AppBuilderShared/utils/parameters/parameterStates";
import {ISdStargateBakeDataResultEnum} from "@shapediver/sdk.stargate-sdk-v1";
import {
	ITreeNode,
	ShapeDiverResponseOutputChunk,
} from "@shapediver/viewer.session";
import {useCallback, useContext, useEffect, useState} from "react";
import {useShallow} from "zustand/react/shallow";
import {useStargateBakeData} from "./useStargateBakeData";
import {ERROR_TYPE_INTERRUPTED} from "./useStargateGetData";

// TODO SS-8820 ideally move these messages to properties that can be controlled from the theme
export const ResultErrorMessages = {
	[ISdStargateBakeDataResultEnum.SUCCESS]:
		"The objects were successfully baked.",
	[ISdStargateBakeDataResultEnum.NOTHING]: "No objects were baked.",
	[ISdStargateBakeDataResultEnum.FAILURE]: "The baking operation failed.",
	[ISdStargateBakeDataResultEnum.CANCEL]:
		"The baking operation was cancelled.",
};

export interface IUseStargateOutputProps {
	chunkId: string;
	chunkName: string;
	outputId: IShapeDiverOutputDefinition["id"];
	typeHint: string;
	sessionId: string;
}

/**
 * Possible statuses for the Stargate output connection.
 */
export enum OutputStatusEnum {
	/** The Stargate service is not available OR no client has been selected. */
	notActive = "notActive",
	/** The selected client does not support the type of the given output. */
	incompatible = "incompatible",
	/** A client is connected and supports the given output type. No objects are available. */
	noObjectAvailable = "noObjectAvailable",
	/** A client is connected and supports the given output type. Objects are available. */
	objectAvailable = "objectAvailable",
	/**
	 * A client is connected and supports the given output type. Objects are available.
	 * The Stargate service is not available OR no client has been selected.
	 */
	objectAvailableNotActive = "objectAvailableNotActive",
	/**
	 * The selected client does not support the type of the given output. Objects are available.
	 */
	objectAvailableIncompatible = "objectAvailableIncompatible",
	/** This should never happen. */
	unsupported = "unsupported",
}

/**
 * Hook providing business logic for Stargate output components.
 */
export const useStargateOutput = ({
	chunkId,
	chunkName,
	outputId,
	typeHint,
	sessionId,
}: IUseStargateOutputProps) => {
	const [isWaiting, setIsWaiting] = useState(false);
	/**
	 * State for keeping the status of the output and count of objects.
	 */
	const [status, setStatus_] = useState<{
		status: OutputStatusEnum;
		count: number | undefined;
	}>({
		status: OutputStatusEnum.notActive,
		count: undefined,
	});

	const setStatus = useCallback(
		(status: OutputStatusEnum, count?: number) =>
			setStatus_({status, count}),
		[],
	);

	/** The representation of the chunk in the scene tree */
	const chunk = useShapeDiverStoreSession(
		useShallow((state) => {
			const session = state.sessions[sessionId];
			if (
				!session.outputs[outputId] ||
				!session.outputs[outputId].node ||
				!session.outputs[outputId].chunks
			) {
				return;
			}
			const chunk = session.outputs[outputId].chunks.find(
				(c) => c.id === chunkId,
			);
			return chunk;
		}),
	);

	const {bakeData} = useStargateBakeData();
	const notifications = useContext(NotificationContext);

	const {networkStatus, selectedClient, getSupportedData, registerReference} =
		useShapeDiverStoreStargate(
			useShallow((state) => ({
				networkStatus: state.networkStatus,
				selectedClient: state.selectedClient,
				getSupportedData: state.getSupportedData,
				registerReference: state.registerReference,
			})),
		);

	// Increase the reference count for the Stargate SDK
	useEffect(registerReference, [registerReference]);

	/** Get number of objects available for baking */
	const getObjectsNumber = useCallback(
		(chunk: ShapeDiverResponseOutputChunk | undefined): number => {
			if (!chunk) return 0;
			// TODO file viewer task to type chunks correctly (including node)
			let count = 0;
			const nodeWithChunks = chunk as any & {node: ITreeNode};
			if (nodeWithChunks.node?.children) {
				nodeWithChunks.node.children.forEach((c: ITreeNode) => {
					count += c.children?.length || 0;
				});
			}
			return count;
		},
		[],
	);

	// Update connection status based on network status, selected client,
	// chunk type and scene tree chunk
	useEffect(() => {
		(async () => {
			const objectsNumber = getObjectsNumber(chunk);

			if (
				networkStatus === NetworkStatus.none ||
				networkStatus === NetworkStatus.disconnected
			) {
				if (objectsNumber > 0) {
					setStatus(
						OutputStatusEnum.objectAvailableNotActive,
						objectsNumber,
					);
				} else {
					setStatus(OutputStatusEnum.notActive);
				}
				return;
			}

			const supportedData = await getSupportedData();
			if (!supportedData) {
				setStatus(OutputStatusEnum.notActive);
				return;
			}
			if (!supportedData.typeHints.includes(typeHint)) {
				if (objectsNumber > 0) {
					setStatus(
						OutputStatusEnum.objectAvailableIncompatible,
						objectsNumber,
					);
				} else {
					setStatus(OutputStatusEnum.incompatible);
				}
				return;
			}

			if (networkStatus === NetworkStatus.connected) {
				if (objectsNumber > 0) {
					setStatus(OutputStatusEnum.objectAvailable, objectsNumber);
				} else {
					setStatus(OutputStatusEnum.noObjectAvailable);
				}
				return;
			}

			setStatus(OutputStatusEnum.unsupported);
		})();
	}, [networkStatus, selectedClient, typeHint, chunk]);

	/**
	 * Handler for baking data.
	 */
	const onBakeData = useCallback(async () => {
		setIsWaiting(true);

		const {currentModel} = useShapeDiverStorePlatform.getState();
		if (!currentModel) {
			throw new Error("Current model not available");
		}

		const parameters = getParameterStates(sessionId).reduce(
			(acc, p) => {
				acc[p.definition.id] = p.state.stringExecValue();
				return acc;
			},
			{} as {[key: string]: string},
		);

		const response = await exceptionWrapperAsync(
			() => bakeData(outputId, chunkId, chunkName, parameters),
			() => setIsWaiting(false),
		);

		if (response.error) {
			const e = response.error as any;

			if (e.type === ERROR_TYPE_INTERRUPTED) {
				return;
			}

			notifications.error({
				title: "Baking failed",
				message:
					e.message ||
					ResultErrorMessages[ISdStargateBakeDataResultEnum.FAILURE],
			});
			return;
		}

		const replyDto = response.data[0]; // Suppose that we have only one connection;

		const {result, message} = replyDto.info;

		if (result === ISdStargateBakeDataResultEnum.FAILURE) {
			notifications.error({
				message:
					message ||
					ResultErrorMessages[ISdStargateBakeDataResultEnum.FAILURE],
			});
		} else if (result === ISdStargateBakeDataResultEnum.SUCCESS) {
			notifications.success({
				message:
					message ||
					ResultErrorMessages[ISdStargateBakeDataResultEnum.SUCCESS],
			});
		} else if (result === ISdStargateBakeDataResultEnum.CANCEL) {
			notifications.warning({
				message:
					message ||
					ResultErrorMessages[ISdStargateBakeDataResultEnum.CANCEL],
			});
		} else if (result === ISdStargateBakeDataResultEnum.NOTHING) {
			notifications.warning({
				message:
					message ||
					ResultErrorMessages[ISdStargateBakeDataResultEnum.NOTHING],
			});
		}
	}, [sessionId, bakeData, outputId, chunkId, chunkName]);

	return {
		isWaiting,
		status: status.status,
		count: status.count,
		onBakeData,
	};
};
