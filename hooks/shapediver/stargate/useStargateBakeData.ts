import {useShapeDiverStoreStargate} from "@AppBuilderShared/store/useShapeDiverStoreStargate_";
import {
	ISdStargateBakeDataCommandDto,
	ISdStargateBakeDataReplyDto,
	ISdStargateClientModel,
	SdStargateBakeDataCommand,
} from "@shapediver/sdk.stargate-sdk-v1";

export const ERROR_TYPE_INTERRUPTED = "interrupted";

const promisesStack: Array<{reject: () => void}> = [];

export const useStargateBakeData = () => {
	const bakeData = async (
		client: ISdStargateClientModel | null,
		modelId: string,
		outputId: string,
		chunkId: string,
		chunkName: string,
		parameters: {[id: string]: string},
	): Promise<ISdStargateBakeDataReplyDto[]> => {
		if (!client) {
			throw new Error("Client not found");
		}

		if (promisesStack.length > 0) {
			// Rhino handles only one request at a time, so reject all previous requests
			promisesStack.forEach((s) => {
				s.reject();
			});
		}

		return new Promise((resolve, reject) => {
			promisesStack.push({
				reject: () => {
					const err: Error & {type?: typeof ERROR_TYPE_INTERRUPTED} =
						new Error("Request interrupted");
					err.type = ERROR_TYPE_INTERRUPTED;

					reject(err);
				},
			});

			const {sdk} = useShapeDiverStoreStargate.getState();
			if (!sdk) {
				reject(new Error("Stargate SDK not initialized"));
				return;
			}

			const bakeData = new SdStargateBakeDataCommand(sdk);
			const dto: ISdStargateBakeDataCommandDto = {
				model: {id: modelId},
				parameters,
				output: {
					id: outputId,
					chunk: {
						id: chunkId,
						name: chunkName,
					},
				},
			};

			return bakeData.send(dto, [client]);
		});
	};

	return {
		bakeData,
	};
};
