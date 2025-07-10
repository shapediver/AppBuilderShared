import {ErrorReportingContext} from "@AppBuilderShared/context/ErrorReportingContext";
import {useShapeDiverStorePlatform} from "@AppBuilderShared/store/useShapeDiverStorePlatform";
import {
	getStargateSDK,
	useShapeDiverStoreStargate,
} from "@AppBuilderShared/store/useShapeDiverStoreStargate";
import type {ISdStargateBakeDataReplyDto} from "@shapediver/sdk.stargate-sdk-v1";
import {useCallback, useContext} from "react";

/**
 * We don't want multiple requests to be sent at the same time.
 * An error with this type will be thrown if a request is interrupted.
 */
export const ERROR_TYPE_INTERRUPTED = "interrupted";

/**
 * Promises stack to keep track of pending requests.
 */
const pendingRequestStack: Array<{reject: () => void}> = [];

/**
 * Hook wrapping the Stargate SDK's `bakeData` command.
 * @returns
 */
export const useStargateBakeData = () => {
	const errorReporting = useContext(ErrorReportingContext);

	const bakeData = useCallback(
		async (
			outputId: string,
			chunkId: string,
			chunkName: string,
			parameters: {[id: string]: string},
		): Promise<ISdStargateBakeDataReplyDto[]> => {
			// Reject any pending requests
			// TODO This merely rejects the locally pending promises, but does not
			// cancel any actions pending on the client side. We might want to
			// reconsider this in the future.
			if (pendingRequestStack.length > 0) {
				pendingRequestStack.forEach((s) => {
					s.reject();
				});
				pendingRequestStack.length = 0;
			}

			const {sdkRef, selectedClient} =
				useShapeDiverStoreStargate.getState();
			const sdk = sdkRef?.sdk;

			// We can assume the Stargate SDK to be available, a client to be selected, and
			// a current model to be available in the store.
			// Calling this function without these conditions would be a developer error,
			// and therefore we report it to Sentry.
			if (!sdk) {
				const error = new Error("Stargate SDK not available");
				errorReporting.captureException(error);
				throw error;
			}

			if (!selectedClient) {
				const error = new Error("No client selected");
				errorReporting.captureException(error);
				throw error;
			}

			const {currentModel} = useShapeDiverStorePlatform.getState();

			if (!currentModel) {
				const error = new Error("Current model not available");
				errorReporting.captureException(error);
				throw error;
			}

			const {SdStargateBakeDataCommand} = await getStargateSDK();

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

				try {
					const command = new SdStargateBakeDataCommand(sdk);
					command
						.send(
							{
								model: {id: currentModel.id},
								parameters,
								output: {
									id: outputId,
									chunk: {
										id: chunkId,
										name: chunkName,
									},
								},
							},
							[selectedClient],
						)
						.then((res: ISdStargateBakeDataReplyDto[]) => {
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
		bakeData,
	};
};
