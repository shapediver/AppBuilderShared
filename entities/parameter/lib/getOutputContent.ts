import {useShapeDiverStoreParameters} from "../model/useShapeDiverStoreParameters";

export type GetOutputContentResult = {
	found: boolean;
	content?: unknown;
	message?: string;
};

/**
 * Latest output content by id, name, or displayname.
 * Shared by e-commerce getOutput and tools getMetric.
 */
export function getOutputContent(
	namespace: string,
	output: string,
): GetOutputContentResult {
	const store = useShapeDiverStoreParameters
		.getState()
		.getOutput(namespace, output);
	if (!store) {
		return {found: false};
	}
	return {found: true, content: store.getState().content};
}
