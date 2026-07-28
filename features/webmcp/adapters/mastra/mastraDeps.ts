import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import type {ToolDeps} from "../../core/deps";
import {createModelStateFromStores} from "./createModelStateFromStores";
import {importModelStateFromStores} from "./importModelStateFromStores";

export function buildMastraDeps(
	namespace: string,
	options?: {
		viewportId?: string;
		/** Same list as CreateModelStateHook theme default; host must supply (e.g. ["context"]). */
		parameterNamesToAlwaysExclude?: string[];
	},
): ToolDeps {
	const viewportId = options?.viewportId ?? "viewport_1";
	const parameterNamesToAlwaysExclude =
		options?.parameterNamesToAlwaysExclude ?? [];
	return {
		namespace,
		getLiveParameters: (ns) => {
			const stores =
				useShapeDiverStoreParameters.getState().parameterStores[ns] ??
				{};
			return Object.values(stores).map((s) => s.getState());
		},
		listParameterNamespaces: () =>
			Object.keys(
				useShapeDiverStoreParameters.getState().parameterStores,
			),
		batchParameterValueUpdate: (...args) =>
			useShapeDiverStoreParameters
				.getState()
				.batchParameterValueUpdate(...args),
		createModelState: (props) =>
			createModelStateFromStores(
				namespace,
				props,
				viewportId,
				parameterNamesToAlwaysExclude,
			),
		importModelState: (props) =>
			importModelStateFromStores(namespace, props),
	};
}
