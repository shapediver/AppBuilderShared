import {restoreParameterHistory} from "./runAppBuilderActionUndo";

/** Restore the next parameter-history entry. */
export async function runAppBuilderActionRedo(): Promise<void> {
	await restoreParameterHistory(1);
}
