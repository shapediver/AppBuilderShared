import {NotificationContext} from "@AppBuilderShared/context/NotificationContext";
import {useShapeDiverStorePlatform} from "@AppBuilderShared/store/useShapeDiverStorePlatform";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {useShapeDiverStoreStargate} from "@AppBuilderShared/store/useShapeDiverStoreStargate";
import {IShapeDiverOutputDefinition} from "@AppBuilderShared/types/shapediver/output";
import {
	GetDataResultErrorMessages,
	IStargateClientChoice,
	NetworkStatus,
} from "@AppBuilderShared/types/shapediver/stargate";
import {
	ISdStargateBakeDataResultEnum,
	ISdStargateGetSupportedDataReplyDto,
	SdStargateBakeDataCommand,
} from "@shapediver/sdk.stargate-sdk-v1";
import {ITreeNode} from "@shapediver/viewer.session";
import {useCallback, useContext, useEffect, useState} from "react";
import {ERROR_TYPE_INTERRUPTED} from "./useStargateGetData";

export interface IUseStargateOutputProps {
	chunkId: string;
	outputId: IShapeDiverOutputDefinition["id"];
	typeHint: string;
	name: string;
	networkStatus: NetworkStatus;
	supportedData: ISdStargateGetSupportedDataReplyDto[];
	selectedClient: IStargateClientChoice | null | undefined;
	sessionId?: string;
}

export type IStatusData = {
	color: string;
	message: string;
	isBtnDisabled: boolean;
	count?: number;
	hint?: string;
};

export enum OutputStatuses {
	noActive = "noActive",
	incompatible = "incompatible",
	noObjectSelected = "noObjectSelected",
	objectSelected = "objectSelected",
	objectSelectedNoActive = "objectSelectedNoActive",
	unsupported = "unsupported",
}

const ConnectionDataMap: {[key in OutputStatuses]: IStatusData} = {
	[OutputStatuses.noActive]: {
		color: "var(--mantine-color-gray-2)",
		message: "No active client found",
		isBtnDisabled: true,
	},
	[OutputStatuses.incompatible]: {
		color: "var(--mantine-color-gray-2)",
		message: "Incompatible output",
		isBtnDisabled: true,
	},
	[OutputStatuses.noObjectSelected]: {
		color: "orange",
		message: "This output is empty",
		isBtnDisabled: true,
	},
	[OutputStatuses.objectSelected]: {
		color: "var(--mantine-primary-color-filled)",
		message: "Bake in the active client",
		isBtnDisabled: false,
	},
	[OutputStatuses.objectSelectedNoActive]: {
		color: "var(--mantine-color-gray-2)",
		message: "Bake in the active client",
		isBtnDisabled: true,
	},
	[OutputStatuses.unsupported]: {
		color: "orange",
		message: "Unsupported connection status",
		isBtnDisabled: true,
	},
};

export const useStargateOutput = ({
	chunkId,
	outputId,
	name,
	typeHint,
	networkStatus,
	supportedData,
	selectedClient,
	sessionId,
}: IUseStargateOutputProps) => {
	const [isLoading, setIsLoading] = useState(false);
	const [connectionStatus, setConnectionStatus] = useState<IStatusData>(
		ConnectionDataMap[OutputStatuses.noActive],
	);
	const {sessions} = useShapeDiverStoreSession();
	const notifications = useContext(NotificationContext);

	const getObjectsNumber = useCallback((): number | undefined => {
		if (!outputId || !chunkId || !sessionId) return undefined;

		const session = sessions[sessionId];
		if (!session) return undefined;

		// Early out if the output has not been computed yet
		if (
			!session.outputs[outputId] ||
			!session.outputs[outputId].node ||
			!session.outputs[outputId].chunks
		) {
			return 0;
		}

		// Search for the node that represents the chunk
		const chunkDef = session.outputs[outputId].chunks?.find(
			(c: any) => c.id === chunkId,
		);

		// Early out if the node cannot be found
		if (!chunkDef) return 0;

		// Return the length of the children array at the second level
		// The first level is the branch level (e.g. "[0]")
		let count = 0;
		const nodeWithChunks = chunkDef as any & {node: ITreeNode};
		if (nodeWithChunks.node?.children) {
			nodeWithChunks.node.children.forEach((c: ITreeNode) => {
				count += c.children?.length || 0;
			});
		}

		return count;
	}, [outputId, chunkId, sessions, sessionId]);

	const getConnectionStatusFromClient = useCallback((): {
		status: OutputStatuses;
		rewrite?: Partial<IStatusData>;
	} => {
		const isOutputSupported = supportedData.some((data) => {
			return data.typeHints?.includes(typeHint);
		});

		if (!isOutputSupported) {
			return {
				status: OutputStatuses.incompatible,
			};
		}

		const objectsNumber = getObjectsNumber();

		if (objectsNumber === undefined) {
			return {
				status: OutputStatuses.unsupported,
			};
		}

		if (objectsNumber > 0) {
			return {
				status: OutputStatuses.objectSelected,
				rewrite: {count: objectsNumber},
			};
		}

		return {
			status: OutputStatuses.noObjectSelected,
		};
	}, [supportedData, typeHint, getObjectsNumber]);

	// Function to set connection status by output status enum
	const setConnectionStatusByEnum = (
		status: OutputStatuses,
		additionalData?: Partial<IStatusData>,
	) => {
		const baseStatus = ConnectionDataMap[status];
		let newStatus = additionalData
			? {...baseStatus, ...additionalData}
			: baseStatus;

		if (
			status === OutputStatuses.noObjectSelected ||
			(status === OutputStatuses.objectSelected &&
				additionalData?.count === 0)
		) {
			newStatus = {
				...newStatus,
				message: newStatus.message.replace("$1", name.toLowerCase()),
			};

			if (additionalData?.count === 0) {
				notifications.warning({
					title: "Output is empty",
					message:
						GetDataResultErrorMessages[
							ISdStargateBakeDataResultEnum.NOTHING
						],
				});
			}
		}

		setConnectionStatus(newStatus);
	};

	const updateConnectionStatus = useCallback(() => {
		if (
			networkStatus === NetworkStatus.none ||
			networkStatus === NetworkStatus.disconnected
		) {
			const objectsNumber = getObjectsNumber();
			if (objectsNumber && objectsNumber > 0) {
				setConnectionStatusByEnum(
					OutputStatuses.objectSelectedNoActive,
				);
			} else {
				setConnectionStatusByEnum(OutputStatuses.noActive);
			}
			return;
		}

		if (networkStatus === NetworkStatus.connected) {
			const {status, rewrite} = getConnectionStatusFromClient();
			setConnectionStatusByEnum(status, rewrite);
			return;
		}

		setConnectionStatusByEnum(OutputStatuses.unsupported);
	}, [networkStatus, getObjectsNumber, getConnectionStatusFromClient]);

	useEffect(() => {
		updateConnectionStatus();
	}, [updateConnectionStatus]);

	// Watch for client changes
	useEffect(() => {
		if (networkStatus === NetworkStatus.connected) {
			const {status, rewrite} = getConnectionStatusFromClient();
			setConnectionStatusByEnum(status, rewrite);
		}
	}, [selectedClient]);

	// Watch for session updates to update object count
	useEffect(() => {
		if (networkStatus === NetworkStatus.connected) {
			const count = getObjectsNumber();
			setConnectionStatus((prev) => ({
				...prev,
				count,
			}));
		}
	}, [sessionId]);

	const onBakeData = async () => {
		setIsLoading(true);

		try {
			if (!sessionId) {
				throw new Error("Session ID is required");
			}

			const {currentModel} = useShapeDiverStorePlatform.getState();
			const session = sessions[sessionId];

			if (!currentModel) {
				throw new Error("Model ID is required");
			}

			if (!session) {
				throw new Error("Session not found");
			}

			// Get all parameter values from the session
			const parameters = Object.values(session.parameters).reduce(
				(acc: {[key: string]: string}, p: any) => {
					acc[p.id] = p.stringify();
					return acc;
				},
				{},
			);

			// Use the SDK to bake data
			const {sdk} = useShapeDiverStoreStargate.getState();
			if (!sdk) {
				throw new Error("Stargate SDK not initialized");
			}

			const command = new SdStargateBakeDataCommand(sdk);
			const response = await command.send(
				{
					model: {id: currentModel.id},
					output: {
						id: outputId,
						chunk: {id: chunkId},
					},
					parameters,
				},
				selectedClient?.data ? [selectedClient.data] : [],
			);

			const {
				info: {result, message},
			} = response[0];

			if (!result || result === ISdStargateBakeDataResultEnum.FAILURE) {
				notifications.warning({
					title: "Baking failed",
					message:
						message ||
						GetDataResultErrorMessages[
							ISdStargateBakeDataResultEnum.FAILURE
						],
				});
				return;
			}

			if (result === ISdStargateBakeDataResultEnum.SUCCESS) {
				notifications.success({
					title: "Baking successful",
					message:
						message ||
						GetDataResultErrorMessages[
							ISdStargateBakeDataResultEnum.SUCCESS
						],
				});
				return;
			}

			if (result === ISdStargateBakeDataResultEnum.CANCEL) {
				notifications.warning({
					title: "Baking cancelled",
					message:
						message ||
						GetDataResultErrorMessages[
							ISdStargateBakeDataResultEnum.CANCEL
						],
				});
				return;
			}

			if (result === ISdStargateBakeDataResultEnum.NOTHING) {
				notifications.warning({
					title: "Nothing to bake",
					message:
						message ||
						GetDataResultErrorMessages[
							ISdStargateBakeDataResultEnum.NOTHING
						],
				});
				return;
			}

			notifications.warning({
				title: "Baking failed",
				message:
					message ||
					GetDataResultErrorMessages[
						ISdStargateBakeDataResultEnum.FAILURE
					],
			});
		} catch (e: any) {
			if (e.type === ERROR_TYPE_INTERRUPTED) {
				return;
			}

			console.error(e);
			// $sentry.captureException(e);
			notifications.warning({
				title: "Baking error",
				message:
					GetDataResultErrorMessages[
						ISdStargateBakeDataResultEnum.FAILURE
					],
			});
		} finally {
			setIsLoading(false);
		}
	};

	return {
		connectionStatus,
		isLoading,
		onBakeData,
	};
};
