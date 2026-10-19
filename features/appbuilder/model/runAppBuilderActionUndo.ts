import {restoreParameterHistory} from "@AppBuilderLib/entities/parameter/lib/undoRedoParameters";

export {restoreParameterHistory};

/** Restore the previous parameter-history entry. */
export async function runAppBuilderActionUndo(): Promise<void> {
	await restoreParameterHistory(-1);
}
