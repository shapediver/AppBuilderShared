import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {IOutputApi} from "@shapediver/viewer.session";

/**
 * Hook providing access to outputs by id or name.
 *
 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/IOutputApi.html
 *
 * @param sessionId
 * @param outputIdOrName
 * @returns
 */
export function useOutput(
	sessionId: string,
	outputId: string,
): {
	/**
	 * API of the output
	 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/IOutputApi.html
	 */
	outputApi: IOutputApi | undefined;
} {
	const outputApi = useShapeDiverStoreSession((state) => {
		const sessionApi = state.sessions[sessionId];
		if (!sessionApi || !sessionApi.outputs) return;
		return sessionApi.getOutputById(outputId) ?? undefined;
	});

	return {
		outputApi,
	};
}
