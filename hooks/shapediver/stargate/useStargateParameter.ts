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

export const useStargateParameter = ({
	parameterId,
	parameterType,
	parameterValue,
	handleChange,
}: IUseStargateParameterProps) => {
	const [isWaiting, setIsWaiting] = useState(false);
	/**
	 * State for keeping the status of the parameter and count of objects.
	 * Note: In case the input is displayed multiple times in the UI, the
	 * count will not be shown correctly, because its state is local to
	 * the instance of the component.
	 */
	const [status, setStatus_] = useState<{
		status: ParameterStatusEnum;
		count: number | undefined;
	}>({
		status: ParameterStatusEnum.notActive,
		count: undefined,
	});

	const setStatus = useCallback(
		(status: ParameterStatusEnum, count?: number) => {
			if (
				status === ParameterStatusEnum.objectSelected &&
				count === undefined
			) {
				// If the status is objectSelected and no count is given,
				// we do not modify the count
				setStatus_((s) => {
					return {
						...s,
						status,
					};
				});
			} else {
				setStatus_({status, count});
			}
		},
		[],
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

	// Update connection status based on network status, selected client,
	// parameter type and value
	useEffect(() => {
		(async () => {
			if (
				networkStatus === NetworkStatus.none ||
				networkStatus === NetworkStatus.disconnected
			) {
				setStatus(ParameterStatusEnum.notActive);
				return;
			}

			if (networkStatus === NetworkStatus.connected) {
				const supportedData = await getSupportedData();
				if (!supportedData) {
					setStatus(ParameterStatusEnum.notActive);
					return;
				}
				if (!supportedData.parameterTypes.includes(parameterType)) {
					setStatus(ParameterStatusEnum.incompatible);
					return;
				}
				if (parameterValue)
					setStatus(ParameterStatusEnum.objectSelected);
				else setStatus(ParameterStatusEnum.noObjectSelected);
				return;
			}

			setStatus(ParameterStatusEnum.unsupported);
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
			setStatus(ParameterStatusEnum.noObjectSelected);
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
			setStatus(ParameterStatusEnum.objectSelected, count);
			handleChange(value);
		}
	}, [parameterId]);

	const onClearSelection = useCallback(() => {
		if (networkStatus === NetworkStatus.connected) {
			setStatus(ParameterStatusEnum.noObjectSelected);
		} else {
			setStatus(ParameterStatusEnum.notActive);
		}

		handleChange("");
	}, [networkStatus]);

	return {
		count: status.count,
		status: status.status,
		isWaiting,
		onObjectAdd,
		onClearSelection,
	};
};
