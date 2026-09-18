import {restoreParameterHistory} from "@AppBuilderLib/entities/parameter/lib/undoRedoParameters";

/** Restore the next parameter-history entry. */
export async function runAppBuilderActionRedo(): Promise<void> {
	await restoreParameterHistory(1);
}
