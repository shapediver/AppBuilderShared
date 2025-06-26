import {useShapeDiverStoreStargate} from "@AppBuilderShared/store/useShapeDiverStoreStargate_";
import {
	SdStargateGetDataCommand,
	type ISdStargateClientModel,
} from "@shapediver/sdk.stargate-sdk-v1";
import {type ISdStargateGetDataReplyDto} from "@shapediver/sdk.stargate-sdk-v1/dist/dto/commands/getDataCommand";
import {useCallback} from "react";

export const ERROR_TYPE_INTERRUPTED = "interrupted";

const promisesStack: Array<{reject: () => void}> = [];

export const useStargateGetData = () => {
	const {sdk} = useShapeDiverStoreStargate();

	const getParameterData = useCallback(
		async (
			client: ISdStargateClientModel | null | undefined,
			modelId: string,
			parameterId: string,
		): Promise<ISdStargateGetDataReplyDto[]> => {
			if (promisesStack.length > 0) {
				promisesStack.forEach((s) => {
					s.reject();
				});
				promisesStack.length = 0;
			}

			return new Promise((resolve, reject) => {
				const rejectHandler = () => {
					const err: Error & {type?: typeof ERROR_TYPE_INTERRUPTED} =
						new Error("Request interrupted");
					err.type = ERROR_TYPE_INTERRUPTED;
					reject(err);
				};

				promisesStack.push({reject: rejectHandler});

				if (!sdk) {
					reject(new Error("Stargate SDK not available"));
					return;
				}

				if (!client) {
					reject(new Error("No client selected"));
					return;
				}

				try {
					const command = new SdStargateGetDataCommand(sdk);
					command
						.send(
							{
								model: {id: modelId},
								parameter: {id: parameterId},
							},
							[client],
						)
						.then((res: ISdStargateGetDataReplyDto[]) => {
							const index = promisesStack.findIndex(
								(p) => p.reject === rejectHandler,
							);
							if (index >= 0) {
								promisesStack.splice(index, 1);
							}
							resolve(res);
						})
						.catch((e: unknown) => {
							const index = promisesStack.findIndex(
								(p) => p.reject === rejectHandler,
							);
							if (index >= 0) {
								promisesStack.splice(index, 1);
							}
							reject(e);
						});
				} catch (error) {
					const index = promisesStack.findIndex(
						(p) => p.reject === rejectHandler,
					);
					if (index >= 0) {
						promisesStack.splice(index, 1);
					}
					reject(error);
				}
			});
		},
		[sdk],
	);

	return {
		getParameterData,
	};
};
