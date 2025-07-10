import {NotificationContext} from "@AppBuilderShared/context/NotificationContext";
import {useShapeDiverStorePlatform} from "@AppBuilderShared/store/useShapeDiverStorePlatform";
import {useShapeDiverStoreStargate} from "@AppBuilderShared/store/useShapeDiverStoreStargate";
import {IShapeDiverExportDefinition} from "@AppBuilderShared/types/shapediver/export";
import {
	IExportFileResultEnum,
	NetworkStatus,
} from "@AppBuilderShared/types/shapediver/stargate";
import {exceptionWrapperAsync} from "@AppBuilderShared/utils/exceptionWrapper";
import {getParameterStates} from "@AppBuilderShared/utils/parameters/parameterStates";
import {ShapeDiverResponseExportContent} from "@shapediver/viewer.session";
import {useCallback, useContext, useEffect, useState} from "react";
import {useShallow} from "zustand/react/shallow";
import {useStargateExportFile} from "./useStargateExportFile";
import {ERROR_TYPE_INTERRUPTED} from "./useStargateGetData";

// TODO SS-8820 ideally move these messages to properties that can be controlled from the theme
export const ResultErrorMessages = {
	[IExportFileResultEnum.SUCCESS]: "The file was successfully exported.",
	[IExportFileResultEnum.NOTHING]: "No data was exported.",
	[IExportFileResultEnum.FAILURE]: "The export operation failed.",
	[IExportFileResultEnum.CANCEL]: "The export operation was cancelled.",
};

export interface IUseStargateExportProps {
	exportId: IShapeDiverExportDefinition["id"];
	contentIndex: number;
	sessionId: string;
	/**
	 * Whether to increase the reference count for Stargate (this is
	 * used to decide whether to show the desktop client connection widget)
	 */
	increaseReferenceCount: boolean;
}

/**
 * Possible statuses for the Stargate export connection.
 */
export enum ExportStatusEnum {
	/** The Stargate service is not available OR no client has been selected. */
	notActive = "notActive",
	/**
	 * The selected client does not support the type of the given export.
	 * Note: This is a basic check, the content type can only be checked once
	 * the export result is available.
	 */
	incompatible = "incompatible",
	/** The Stargate service is available AND a client has been selected. */
	active = "active",
}

/**
 * Hook providing business logic for Stargate export components.
 */
export const useStargateExport = ({
	exportId,
	contentIndex,
	sessionId,
	increaseReferenceCount,
}: IUseStargateExportProps) => {
	const [isWaiting, setIsWaiting] = useState(false);
	/**
	 * State for keeping the status of the export.
	 */
	const [status, setStatus] = useState<ExportStatusEnum>(
		ExportStatusEnum.notActive,
	);

	const {exportFile} = useStargateExportFile();
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
	useEffect(() => {
		if (increaseReferenceCount) return registerReference();
	}, [increaseReferenceCount, registerReference]);

	// Update connection status based on network status and selected client.
	useEffect(() => {
		(async () => {
			if (
				networkStatus === NetworkStatus.none ||
				networkStatus === NetworkStatus.disconnected
			) {
				setStatus(ExportStatusEnum.notActive);
				return;
			}

			const supportedData = await getSupportedData();
			if (!supportedData) {
				setStatus(ExportStatusEnum.notActive);
				return;
			}

			if (supportedData.contentTypes.length === 0) {
				setStatus(ExportStatusEnum.incompatible);
				return;
			}

			setStatus(ExportStatusEnum.active);
		})();
	}, [networkStatus, selectedClient]);

	/**
	 * Check if the content type of the export result is supported by the selected client.
	 */
	const isContentSupported = useCallback(
		async (content: ShapeDiverResponseExportContent) => {
			const supportedData = await getSupportedData();
			if (!supportedData) {
				return false;
			}
			return content.contentType
				? supportedData.contentTypes.includes(content.contentType)
				: supportedData.fileExtensions.includes(content.format);
		},
		[],
	);

	/**
	 * Handler for exporting files using Stargate.
	 */
	const onExportFile = useCallback(async () => {
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
			() => exportFile(exportId, contentIndex, parameters),
			() => setIsWaiting(false),
		);

		if (response.error) {
			const e = response.error as any;

			if (e.type === ERROR_TYPE_INTERRUPTED) {
				return;
			}

			notifications.error({
				title: "Export failed",
				message:
					e.message ||
					ResultErrorMessages[IExportFileResultEnum.FAILURE],
			});
			return;
		}

		const replyDto = response.data[0]; // Suppose that we have only one connection;

		const {result, message} = replyDto.info;
		const resultTyped = result as unknown as IExportFileResultEnum;

		if (resultTyped === IExportFileResultEnum.FAILURE) {
			notifications.warning({
				title: "Export failed",
				message:
					message ||
					ResultErrorMessages[IExportFileResultEnum.FAILURE],
			});
		} else if (resultTyped === IExportFileResultEnum.SUCCESS) {
			notifications.success({
				title: "Export successful",
				message:
					message ||
					ResultErrorMessages[IExportFileResultEnum.SUCCESS],
			});
		} else if (resultTyped === IExportFileResultEnum.CANCEL) {
			notifications.warning({
				title: "Export cancelled",
				message:
					message ||
					ResultErrorMessages[IExportFileResultEnum.CANCEL],
			});
		} else if (resultTyped === IExportFileResultEnum.NOTHING) {
			notifications.warning({
				title: "Nothing was exported",
				message:
					message ||
					ResultErrorMessages[IExportFileResultEnum.NOTHING],
			});
		}
	}, [sessionId, exportFile, exportId, contentIndex]);

	return {
		isWaiting,
		isContentSupported,
		status,
		onExportFile,
	};
};
