import {NotificationContext} from "@AppBuilderShared/context/NotificationContext";
import {useShapeDiverStorePlatform} from "@AppBuilderShared/store/useShapeDiverStorePlatform";
import {useShapeDiverStoreStargate} from "@AppBuilderShared/store/useShapeDiverStoreStargate";
import {NetworkStatus} from "@AppBuilderShared/types/shapediver/stargate";
import {exceptionWrapperAsync} from "@AppBuilderShared/utils/exceptionWrapper";
import {ShapeDiverResponseParameterType} from "@shapediver/api.geometry-api-dto-v2";
import {
	ISdStargateBakeDataResultEnum,
	ISdStargateGetDataReplyDto,
	ISdStargateGetDataResultEnum,
	SdStargateErrorTypes,
} from "@shapediver/sdk.stargate-sdk-v1";
import {useCallback, useContext, useEffect, useState} from "react";
import {useShallow} from "zustand/react/shallow";
import {ERROR_TYPE_INTERRUPTED, useStargateGetData} from "./useStargateGetData";

const ParametersGetDataResultErrorMessages = {
	[ISdStargateGetDataResultEnum.NOTHING]:
		"No objects were selected in the client.",
	[ISdStargateGetDataResultEnum.FAILURE]:
		"The selection operation failed in the client.",
	[ISdStargateGetDataResultEnum.CANCEL]:
		"The selection operation was canceled in the client.",
};

export interface IUseStargateParameterProps {
	parameterId: string;
	parameterType: ShapeDiverResponseParameterType;
	parameterValue: string;
	handleChange: (value: string) => void;
}

export type IStatusData = {
	color: string;
	message: string;
	isBtnDisabled: boolean;
	count?: number;
};

/**
 * Possible statuses for the Stargate parameter connection.
 */
export enum ParameterStatusEnum {
	/** The Stargate service is not available OR no client has been selected. */
	notActive = "noActive",
	/** The selected client does not support the type of the given parameter. */
	incompatible = "incompatible",
	/** A client is connected and supports the given parameter type. No objects are selected. */
	noObjectSelected = "noObjectSelected",
	/** A client is connected and supports the given parameter type. Objects are selected. */
	objectSelected = "objectSelected",
	/** This should never happen. */
	unsupported = "unsupported",
}

/**
 * TODO ideally this should be moved to ParameterStargateComponent, as it is UI related.
 */
const ConnectionDataMap: {[key in ParameterStatusEnum]: IStatusData} = {
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
		message: "No $1 selected",
		isBtnDisabled: false,
	},
	[ParameterStatusEnum.objectSelected]: {
		color: "var(--mantine-primary-color-filled)",
		message: "Object(s) selected",
		isBtnDisabled: false,
	},
	[ParameterStatusEnum.unsupported]: {
		color: "orange",
		message: "Unsupported input status",
		isBtnDisabled: true,
	},
};

export const useStargateParameter = ({
	parameterId,
	parameterType,
	parameterValue,
	handleChange,
}: IUseStargateParameterProps) => {
	const [isWaiting, setIsWaiting] = useState(false);
	const [connectionStatus, setConnectionStatus] = useState<IStatusData>(
		ConnectionDataMap[ParameterStatusEnum.notActive],
	);

	const {networkStatus, selectedClient, getSupportedData} =
		useShapeDiverStoreStargate(
			useShallow((state) => ({
				networkStatus: state.networkStatus,
				selectedClient: state.selectedClient,
				getSupportedData: state.getSupportedData,
			})),
		);

	const {getParameterData} = useStargateGetData();
	const notifications = useContext(NotificationContext);

	const setConnectionStatusByEnum = useCallback(
		(
			status: ParameterStatusEnum,
			additionalData?: Partial<IStatusData>,
		) => {
			const baseStatus = ConnectionDataMap[status];
			const newStatus = additionalData
				? {...baseStatus, ...additionalData}
				: baseStatus;
			setConnectionStatus(newStatus);
		},
		[],
	);

	// Update connection status based on network status, selected client,
	// parameter type and value
	useEffect(() => {
		(async () => {
			if (
				networkStatus === NetworkStatus.none ||
				networkStatus === NetworkStatus.disconnected
			) {
				setConnectionStatusByEnum(ParameterStatusEnum.notActive);
				return;
			}

			if (networkStatus === NetworkStatus.connected) {
				const supportedData = await getSupportedData();
				if (!supportedData) {
					setConnectionStatusByEnum(ParameterStatusEnum.notActive);
					return;
				}
				if (!supportedData.parameterTypes.includes(parameterType)) {
					setConnectionStatusByEnum(ParameterStatusEnum.incompatible);
					return;
				}
				if (parameterValue)
					setConnectionStatusByEnum(
						ParameterStatusEnum.objectSelected,
					);
				else
					setConnectionStatusByEnum(
						ParameterStatusEnum.noObjectSelected,
					);
				return;
			}

			setConnectionStatusByEnum(ParameterStatusEnum.unsupported);
		})();
	}, [networkStatus, selectedClient, parameterType, parameterValue]);

	const handleGetDataReplyDto = (res: ISdStargateGetDataReplyDto) => {
		return {
			count: res.info.count,
			value: res.asset?.chunk
				? JSON.stringify(
						{asset: {id: res.asset.id, chunk: res.asset.chunk}},
						null,
						0,
					)
				: res.asset?.id,
		};
	};

	const onObjectAdd = useCallback(async () => {
		setIsWaiting(true);

		const {currentModel} = useShapeDiverStorePlatform.getState();
		if (!currentModel) {
			throw new Error("Current model not available");
		}

		const response = await exceptionWrapperAsync(
			() => getParameterData(parameterId),
			() => setIsWaiting(false),
		);

		if (response.error) {
			const e = response.error as any;

			if (e.type === ERROR_TYPE_INTERRUPTED) {
				return;
			}

			if (e.type === SdStargateErrorTypes.CommandTimeoutError) {
				notifications.warning({
					title: "Response timeout",
					message:
						"The selection operation was canceled due to inactivity in the client.",
				});
			} else {
				notifications.error({
					title: "Response error",
					message:
						e.message ||
						ParametersGetDataResultErrorMessages[
							ISdStargateBakeDataResultEnum.FAILURE
						],
				});
			}
			return;
		}

		if (!response.data || response.data.length === 0) {
			setConnectionStatusByEnum(ParameterStatusEnum.noObjectSelected);
			return;
		}

		const replyDto = response.data[0]; // Suppose that we have only one connection;

		const {result, message} = replyDto.info;

		if (result !== ISdStargateGetDataResultEnum.SUCCESS) {
			notifications.warning({
				title: "Operation unsuccessful",
				message:
					message ||
					ParametersGetDataResultErrorMessages[result] ||
					"Unsupported get data status.",
			});
			return;
		}

		const {count, value} = handleGetDataReplyDto(replyDto);

		if (result === ISdStargateGetDataResultEnum.SUCCESS && count === 0) {
			notifications.warning({
				title: "Response is empty",
				message:
					message ||
					ParametersGetDataResultErrorMessages[
						ISdStargateGetDataResultEnum.NOTHING
					],
			});
			return;
		}

		if (value) {
			setConnectionStatusByEnum(ParameterStatusEnum.objectSelected, {
				count,
			});
			handleChange(value);
		}
	}, [parameterId]);

	const onClearSelection = useCallback(() => {
		if (networkStatus === NetworkStatus.connected) {
			setConnectionStatusByEnum(ParameterStatusEnum.noObjectSelected);
		} else {
			setConnectionStatusByEnum(ParameterStatusEnum.notActive);
		}

		handleChange("");
	}, [networkStatus]);

	return {
		connectionStatus,
		isWaiting,
		onObjectAdd,
		onClearSelection,
	};
};
