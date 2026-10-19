import {useImportModelStateDialogStore} from "@AppBuilderLib/features/model-state/model/useImportModelStateDialogStore";

/** Open the import-model-state dialog and wait until the user confirms or cancels. */
export async function runAppBuilderActionImportModelState(
	namespace: string,
): Promise<void> {
	await useImportModelStateDialogStore.getState().open(namespace);
}
