import {NotificationContext} from "@AppBuilderShared/context/NotificationContext";
import {useShapeDiverStorePlatform} from "@AppBuilderShared/store/useShapeDiverStorePlatform";
import {useShapeDiverStoreStargate} from "@AppBuilderShared/store/useShapeDiverStoreStargate";
import {NetworkStatus} from "@AppBuilderShared/types/shapediver/stargate";
import {ShapeDiverResponseParameterType} from "@shapediver/api.geometry-api-dto-v2";
import {
	ISdStargateBakeDataResultEnum,
	ISdStargateGetDataReplyDto,
	ISdStargateGetDataResultEnum,
	SdStargateErrorTypes,
} from "@shapediver/sdk.stargate-sdk-v1";
import {useCallback, useContext, useEffect, useMemo, useState} from "react";
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
	parameterDefval: string;
	onChange?: (value: any) => void;
}

export type IStatusData = {
	color: string;
	message: string;
	isBtnDisabled: boolean;
	isClearSelection?: boolean;
	count?: number;
};

export enum ParameterStatues {
	noActive = "noActive",
	incompatible = "incompatible",
	noObjectSelected = "noObjectSelected",
	objectSelected = "objectSelected",
	unsupported = "unsupported",
}

const ConnectionDataMap: {[key in ParameterStatues]: IStatusData} = {
	[ParameterStatues.noActive]: {
		color: "var(--mantine-color-gray-2)",
		message: "No active client found",
		isBtnDisabled: true,
		isClearSelection: false,
	},
	[ParameterStatues.incompatible]: {
		color: "var(--mantine-color-gray-2)",
		message: "Incompatible input",
		isBtnDisabled: true,
		isClearSelection: false,
	},
	[ParameterStatues.noObjectSelected]: {
		color: "orange",
		message: "No $1 selected",
		isBtnDisabled: false,
		isClearSelection: false,
	},
	[ParameterStatues.objectSelected]: {
		color: "var(--mantine-primary-color-filled)",
		message: "Object selected",
		isBtnDisabled: false,
		isClearSelection: true,
	},
	[ParameterStatues.unsupported]: {
		color: "orange",
		message: "Unsupported connection status",
		isBtnDisabled: true,
		isClearSelection: false,
	},
};

export const useStargateParameter = ({
	parameterId,
	parameterType,
	parameterValue,
	parameterDefval,
	onChange,
}: IUseStargateParameterProps) => {
	const [isWaiting, setIsWaiting] = useState(false);
	const [connectionStatus, setConnectionStatus] = useState<IStatusData>(
		ConnectionDataMap[ParameterStatues.noActive],
	);

	const {networkStatus, selectedClient, supportedData, isLoading} =
		useShapeDiverStoreStargate(
			useShallow((state) => ({
				networkStatus: state.networkStatus,
				selectedClient: state.selectedClient,
				supportedData: state.supportedData,
				isLoading: state.isLoading,
			})),
		);

	const {getParameterData} = useStargateGetData();
	const notifications = useContext(NotificationContext);

	const hasSelection = useMemo(() => {
		return parameterValue !== parameterDefval && parameterValue !== "";
	}, [parameterValue, parameterDefval]);

	const getConnectionStatusFromClient = useCallback((): {
		status: ParameterStatues;
	} => {
		const isParameterSupported = supportedData.some((data) => {
			return data.parameterTypes.includes(parameterType);
		});

		if (!isParameterSupported) {
			return {
				status: ParameterStatues.incompatible,
			};
		}

		if (parameterValue) {
			return {
				status: ParameterStatues.objectSelected,
			};
		}

		return {
			status: ParameterStatues.noObjectSelected,
		};
	}, [supportedData, parameterType, parameterValue]);

	const setConnectionStatusByEnum = useCallback(
		(status: ParameterStatues, additionalData?: Partial<IStatusData>) => {
			const baseStatus = ConnectionDataMap[status];
			const newStatus = additionalData
				? {...baseStatus, ...additionalData}
				: baseStatus;
			setConnectionStatus(newStatus);
		},
		[networkStatus, selectedClient],
	);

	const updateConnectionStatus = useCallback(() => {
		if (
			networkStatus === NetworkStatus.none ||
			networkStatus === NetworkStatus.disconnected
		) {
			setConnectionStatusByEnum(ParameterStatues.noActive);
			return;
		}

		if (networkStatus === NetworkStatus.connected) {
			const connectionData = getConnectionStatusFromClient();
			setConnectionStatusByEnum(connectionData.status);
			return;
		}

		setConnectionStatusByEnum(ParameterStatues.unsupported);
	}, [networkStatus, selectedClient]);

	useEffect(() => {
		updateConnectionStatus();
	}, [networkStatus, selectedClient]);

	const handleGetDataResponse = (res: ISdStargateGetDataReplyDto) => {
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
			throw new Error("Model ID is required");
		}

		try {
			const newParamData = await getParameterData(
				selectedClient?.data,
				currentModel.id,
				parameterId,
			);

			if (newParamData.length === 0) {
				setConnectionStatusByEnum(ParameterStatues.noObjectSelected);
				return;
			}

			const response = newParamData[0]; // Suppose that we have only one connection;

			const {result, message} = response.info;

			if (result !== ISdStargateGetDataResultEnum.SUCCESS) {
				notifications.warning({
					title: "Response error",
					message:
						message ||
						ParametersGetDataResultErrorMessages[result] ||
						"Unsupported get data status.",
				});
				return;
			}

			const {count, value: valueData} = handleGetDataResponse(response);

			if (
				result === ISdStargateGetDataResultEnum.SUCCESS &&
				count === 0
			) {
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

			if (valueData) {
				setConnectionStatusByEnum(ParameterStatues.objectSelected, {
					count,
				});
				if (onChange) {
					onChange(valueData);
				}
			}
		} catch (e: any) {
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
				console.error(e);
				notifications.warning({
					title: "Response error",
					message:
						ParametersGetDataResultErrorMessages[
							ISdStargateBakeDataResultEnum.FAILURE
						],
				});
			}
		} finally {
			setIsWaiting(false);
		}
	}, [selectedClient, parameterId]);

	const onClearSelection = useCallback(() => {
		if (networkStatus === NetworkStatus.connected) {
			setConnectionStatusByEnum(ParameterStatues.noObjectSelected);
		} else {
			setConnectionStatusByEnum(ParameterStatues.noActive);
		}

		if (onChange) {
			onChange("");
		}
	}, [connectionStatus, networkStatus]);

	return {
		connectionStatus,
		isLoading,
		isWaiting,
		onObjectAdd,
		onClearSelection,
		hasSelection,
	};
};
