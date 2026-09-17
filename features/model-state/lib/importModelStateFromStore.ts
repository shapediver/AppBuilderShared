import {getParameterStates} from "@AppBuilderLib/entities/parameter/lib/parameterStates";
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";
import type {
	IImportModelStateData,
	IImportModelStateResult,
} from "../config/importModelState";
import {importModelStateCore} from "./importModelStateCore";

/**
 * Import a model state from Zustand stores. No React, no toasts.
 */
export async function importModelStateFromStore(
	namespace: string,
	props: IImportModelStateData,
): Promise<IImportModelStateResult> {
	const sessionApi = useShapeDiverStoreSession.getState().sessions[namespace];
	const {batchParameterValueUpdate, clearUnsavedChanges} =
		useShapeDiverStoreParameters.getState();

	return importModelStateCore({
		sessionApi,
		namespace,
		getParameterStates,
		batchParameterValueUpdate,
		clearUnsavedChanges,
		props,
	});
}
