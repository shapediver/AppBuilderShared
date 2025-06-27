import {ErrorReportingContext} from "@AppBuilderShared/context/ErrorReportingContext";
import {useShapeDiverStorePlatform} from "@AppBuilderShared/store/useShapeDiverStorePlatform";
import {useShapeDiverStoreStargate} from "@AppBuilderShared/store/useShapeDiverStoreStargate";
import {SdStargateGetDataCommand} from "@shapediver/sdk.stargate-sdk-v1";
import {type ISdStargateGetDataReplyDto} from "@shapediver/sdk.stargate-sdk-v1/dist/dto/commands/getDataCommand";
import {useCallback, useContext} from "react";

/**
 * We don't want multiple "get data" requests to be sent at the same time.
 * An error with this type will be thrown if a request is interrupted.
 */
export const ERROR_TYPE_INTERRUPTED = "interrupted";

/**
 * Promises stack to keep track of pending "get data" requests.
 */
const pendingRequestStack: Array<{reject: () => void}> = [];

/**
 * Hook wrapping the Stargate SDK's `getData` command.
 * @returns
 */
export const useStargateGetData = () => {
	const errorReporting = useContext(ErrorReportingContext);

	const getParameterData = useCallback(
		async (parameterId: string): Promise<ISdStargateGetDataReplyDto[]> => {
			// Reject any pending "get data" requests
			if (pendingRequestStack.length > 0) {
				pendingRequestStack.forEach((s) => {
					s.reject();
				});
				pendingRequestStack.length = 0;
			}

			const {sdkRef, selectedClient} =
				useShapeDiverStoreStargate.getState();
			const sdk = sdkRef?.sdk;

			return new Promise((resolve, reject) => {
				// Handler for rejecting a pending request
				const rejectHandler = () => {
					const err: Error & {type?: typeof ERROR_TYPE_INTERRUPTED} =
						new Error("Request interrupted");
					err.type = ERROR_TYPE_INTERRUPTED;
					reject(err);
				};
				pendingRequestStack.push({reject: rejectHandler});

				const removeRejectHandler = () => {
					const index = pendingRequestStack.findIndex(
						(p) => p.reject === rejectHandler,
					);
					if (index >= 0) {
						pendingRequestStack.splice(index, 1);
					}
				};

				// We can assume the Stargate SDK to be available, a client to be selected, and
				// a current model to be available in the store.
				// Calling this function without these conditions would be a developer error,
				// and therefore we report it to Sentry.
				if (!sdk) {
					const error = new Error("Stargate SDK not available");
					errorReporting.captureException(error);
					reject(error);
					return;
				}

				if (!selectedClient) {
					const error = new Error("No client selected");
					errorReporting.captureException(error);
					reject(error);
					return;
				}

				const {currentModel} = useShapeDiverStorePlatform.getState();

				if (!currentModel) {
					const error = new Error("Current model not available");
					errorReporting.captureException(error);
					reject(error);
					return;
				}

				try {
					const command = new SdStargateGetDataCommand(sdk);
					command
						.send(
							{
								model: {id: currentModel.id},
								parameter: {id: parameterId},
							},
							[selectedClient],
						)
						.then((res: ISdStargateGetDataReplyDto[]) => {
							removeRejectHandler();
							resolve(res);
						})
						.catch((e: unknown) => {
							removeRejectHandler();
							reject(e);
						});
				} catch (error) {
					removeRejectHandler();
					reject(error);
				}
			});
		},
		[],
	);

	return {
		getParameterData,
	};
};
