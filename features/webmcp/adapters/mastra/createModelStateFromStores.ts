import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";
import {useShapeDiverStoreViewportAccessFunctions} from "@AppBuilderLib/entities/viewport/model/useShapeDiverStoreViewportAccessFunctions";
import type {
	ICreateModelStateData,
	ICreateModelStateResult,
} from "@AppBuilderLib/features/model-state/config/createModelState";
import {createModelStateCore} from "@AppBuilderLib/features/model-state/lib/createModelStateCore";

/**
 * Store-backed createModelState for Mastra (non-React).
 * Live WebMCP gets `parameterNamesToAlwaysExclude` from the theme via
 * `useProps("CreateModelStateHook", …)`. Mastra hosts must pass the same
 * list (e.g. `["context"]` from themeOverrides) — it is not read from Mantine here.
 */
export async function createModelStateFromStores(
	namespace: string,
	props: ICreateModelStateData,
	viewportId = "viewport_1",
	parameterNamesToAlwaysExclude: string[] = [],
): Promise<ICreateModelStateResult> {
	const sessions = useShapeDiverStoreSession.getState().sessions;
	const sessionApi = sessions[namespace];
	const viewportAccessFunctions =
		useShapeDiverStoreViewportAccessFunctions.getState()
			.viewportAccessFunctions[viewportId];
	const clearUnsavedChanges =
		useShapeDiverStoreParameters.getState().clearUnsavedChanges;

	return createModelStateCore({
		sessionApi,
		sessions,
		sessionId: namespace,
		viewportAccessFunctions,
		clearUnsavedChanges,
		parameterNamesToAlwaysExclude,
		props,
	});
}
