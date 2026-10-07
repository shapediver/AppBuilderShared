import {resolveViewportIdFromStore} from "@AppBuilderLib/entities/viewport/lib/resolveViewportIdFromStore";
import {createModelStateFromStores} from "@AppBuilderLib/features/appbuilder/model/runAppBuilderActionCreateModelState";
import type {ICreateModelStateData} from "@AppBuilderLib/features/model-state/config/createModelState";
import {createModelStateDataSchema} from "@AppBuilderLib/features/model-state/config/createModelState.zod";
import {importModelStateDataSchema} from "@AppBuilderLib/features/model-state/config/importModelState.zod";
import {importModelStateFromStore} from "@AppBuilderLib/features/model-state/lib/importModelStateFromStore";
import type {IToolsApiModelStateHandlers} from "../config/toolsApiConnector";

function invalidDataError(action: string, error: unknown): Error {
	return new Error(`Invalid data for ${action}`, {cause: error});
}

/**
 * ToolsApi model-state handlers. Same store functions as the e-commerce
 * connector, addressed at the live session namespace.
 */
export function toolsApiModelStateHandlers(
	getNamespace: () => string | undefined,
): IToolsApiModelStateHandlers {
	return {
		async createModelState(data) {
			const parsed = createModelStateDataSchema.safeParse(data ?? {});
			if (!parsed.success) {
				throw invalidDataError("createModelState", parsed.error);
			}
			const namespace = getNamespace()?.trim();
			if (!namespace) return {};
			return createModelStateFromStores(
				namespace,
				resolveViewportIdFromStore(),
				parsed.data as ICreateModelStateData,
			);
		},
		async importModelState(data) {
			const parsed = importModelStateDataSchema.safeParse(data);
			if (!parsed.success) {
				throw invalidDataError("importModelState", parsed.error);
			}
			const namespace = getNamespace()?.trim();
			if (!namespace) {
				return {success: false, message: "No session is open."};
			}
			return importModelStateFromStore(namespace, parsed.data);
		},
	};
}
