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

// TODO SS-8820 ideally move these messages to properties that can be controlled from the theme
const ResultErrorMessages = {
	[ISdStargateGetDataResultEnum.NOTHING]:
		"No objects were selected in the client.",
	[ISdStargateGetDataResultEnum.FAILURE]:
		"The selection operation failed in the client.",
	[ISdStargateGetDataResultEnum.CANCEL]:
		"The selection operation was cancelled in the client.",
};

export interface IUseStargateParameterProps {
	/** ID of the parameter */
	parameterId: string;
	/** Type of the parameter */
	parameterType: ShapeDiverResponseParameterType;
	/** Whether the parameter has a non-empty value */
	hasValue: boolean;
	/** Supported formats for parameters of type "File" */
	parameterFormat: string[] | undefined;
	/** Handler for changing the parameter value */
	handleChange: (value: string, timeout?: number) => void;
}

/**
 * Possible statuses for the Stargate parameter connection.
 */
export enum ParameterStatusEnum {
	/** The Stargate service is not available OR no client has been selected. */
	notActive = "notActive",
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
 * Hook providing business logic for Stargate parameter components.
 */
export const useStargateParameter = ({
	parameterId,
	parameterType,
	hasValue,
	parameterFormat,
	handleChange,
}: IUseStargateParameterProps) => {
	const [isWaiting, setIsWaiting] = useState(false);
	/**
	 * State for keeping the status of the parameter and count of objects.
	 * Note: In case the input is displayed multiple times in the UI, the
	 * count will not be shown correctly, because its state is local to
	 * the instance of the component.
	 * The same happens when navigating through the parameter history.
	 * To fix this, the input sdTF would need to be downloaded and the
	 * count would need to be read from it.
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

	const {networkStatus, selectedClient, getSupportedData, registerReference} =
		useShapeDiverStoreStargate(
			useShallow((state) => ({
				networkStatus: state.networkStatus,
				selectedClient: state.selectedClient,
				getSupportedData: state.getSupportedData,
				registerReference: state.registerReference,
			})),
		);

	const {getParameterData} = useStargateGetData();
	const notifications = useContext(NotificationContext);

	// Increase the reference count for the Stargate SDK
	useEffect(registerReference, [registerReference]);

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
				if (
					parameterType === ShapeDiverResponseParameterType.FILE &&
					parameterFormat &&
					!parameterFormat.some((ct) =>
						supportedData.contentTypes.includes(ct),
					)
				) {
					setStatus(ParameterStatusEnum.incompatible);
					return;
				}
				if (hasValue) setStatus(ParameterStatusEnum.objectSelected);
				else setStatus(ParameterStatusEnum.noObjectSelected);
				return;
			}

			setStatus(ParameterStatusEnum.unsupported);
		})();
	}, [
		networkStatus,
		selectedClient,
		parameterType,
		hasValue,
		parameterFormat,
	]);

	/**
	 * Handles the reply from the Stargate get data request,
	 * depending on the parameter type.
	 */
	const handleGetDataReplyDto = useCallback(
		(res: ISdStargateGetDataReplyDto) => {
			if (parameterType === ShapeDiverResponseParameterType.FILE) {
				return {
					count: res.info.count,
					value: res.asset?.id,
				};
			}
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
		},
		[parameterType],
	);

	/**
	 * Handler for getting data
	 */
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
						"The selection operation was cancelled due to inactivity in the client.",
				});
			} else {
				notifications.error({
					title: "Response error",
					message:
						e.message ||
						ResultErrorMessages[
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
					ResultErrorMessages[result] ||
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
					ResultErrorMessages[ISdStargateGetDataResultEnum.NOTHING],
			});
			return;
		}

		if (value) {
			setStatus(ParameterStatusEnum.objectSelected, count);
			handleChange(value, 0);
		}
	}, [parameterId]);

	const onClearSelection = useCallback(() => {
		if (networkStatus === NetworkStatus.connected) {
			setStatus(ParameterStatusEnum.noObjectSelected);
		} else {
			setStatus(ParameterStatusEnum.notActive);
		}

		handleChange("", 0);
	}, [networkStatus]);

	return {
		count: status.count,
		status: status.status,
		isWaiting,
		onObjectAdd,
		onClearSelection,
	};
};
