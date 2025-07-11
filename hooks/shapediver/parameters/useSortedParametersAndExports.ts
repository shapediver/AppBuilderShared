import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {PropsExport} from "@AppBuilderShared/types/components/shapediver/propsExport";
import {PropsOutput} from "@AppBuilderShared/types/components/shapediver/propsOutput";
import {PropsParameter} from "@AppBuilderShared/types/components/shapediver/propsParameter";
import {
	IShapeDiverParamOrExportDefinition,
	IShapeDiverParamOrExportOrOutputDefinition,
} from "@AppBuilderShared/types/shapediver/common";
import {useShallow} from "zustand/react/shallow";

/**
 * The definition of a parameter, export, or output, and the corresponding properties.
 */
type ParamOrExportOrOutputDefinition =
	| {
			parameter: PropsParameter;
			definition: IShapeDiverParamOrExportDefinition;
	  }
	| {
			export: PropsExport;
			definition: IShapeDiverParamOrExportDefinition;
	  }
	| {
			output: PropsOutput;
			definition: IShapeDiverParamOrExportOrOutputDefinition;
	  };

/** assert parameter definition */
export function isParamDefinition(
	def: ParamOrExportOrOutputDefinition,
): def is {
	parameter: PropsParameter;
	definition: IShapeDiverParamOrExportDefinition;
} {
	return "parameter" in def;
}

/** assert export definition */
export function isExportDefinition(
	def: ParamOrExportOrOutputDefinition,
): def is {
	export: PropsExport;
	definition: IShapeDiverParamOrExportDefinition;
} {
	return "export" in def;
}

/** assert export definition */
export function isOutputDefinition(
	def: ParamOrExportOrOutputDefinition,
): def is {
	output: PropsOutput;
	definition: IShapeDiverParamOrExportOrOutputDefinition;
} {
	return "output" in def;
}

/**
 * Hook providing a sorted list of definitions of parameters, exports, and outputs, used
 * by UI components for creating parameter, export, and output components.
 * @param parameters parameter references
 * @param exports export references
 * @param outputs output references
 * @returns
 */
export function useSortedParametersAndExports(
	parameters?: PropsParameter[],
	exports?: PropsExport[],
	outputs?: PropsOutput[],
): ParamOrExportOrOutputDefinition[] {
	const {parameterStores, exportStores, outputStores} =
		useShapeDiverStoreParameters(
			useShallow((state) => ({
				parameterStores: state.parameterStores,
				exportStores: state.exportStores,
				outputStores: state.outputStores,
			})),
		);

	// collect definitions of parameters and exports for sorting and grouping
	let sortedParamsAndExports: ParamOrExportOrOutputDefinition[] = [];
	sortedParamsAndExports = sortedParamsAndExports.concat(
		(parameters ?? []).flatMap((p) => {
			const stores = Object.values(parameterStores[p.namespace] ?? {});
			for (const store of stores) {
				const {definition, acceptRejectMode} = store.getState();
				if (
					definition.id === p.parameterId ||
					definition.name === p.parameterId ||
					definition.displayname === p.parameterId
				)
					return {
						parameter: {
							...p,
							// in case the parameter reference defines acceptRejectMode, use it
							// otherwise fall back to acceptRejectMode given by parameter definition
							acceptRejectMode:
								p.acceptRejectMode === undefined
									? acceptRejectMode
									: p.acceptRejectMode,
						},
						definition: {
							...definition,
							...p.overrides,
						},
					};
			}

			return [];
		}),
	); // <-- TODO SS-8052 move into useMemo

	sortedParamsAndExports = sortedParamsAndExports.concat(
		(exports ?? []).flatMap((e) => {
			const stores = Object.values(exportStores[e.namespace] ?? {});
			for (const store of stores) {
				const definition = store.getState().definition;
				if (
					definition.id === e.exportId ||
					definition.name === e.exportId ||
					definition.displayname === e.exportId
				)
					return {
						export: e,
						definition: {...definition, ...e.overrides},
					};
			}

			return [];
		}),
	); // <-- TODO SS-8052 move into useMemo

	sortedParamsAndExports = sortedParamsAndExports.concat(
		(outputs ?? []).flatMap((o) => {
			const stores = Object.values(outputStores[o.namespace] ?? {});
			for (const store of stores) {
				const definition = store.getState().definition;
				if (
					definition.id === o.outputId ||
					definition.name === o.outputId ||
					definition.displayname === o.outputId
				)
					return {
						output: o,
						definition: {
							...definition,
							...o.overrides,
						},
					};
			}

			return [];
		}),
	); // <-- TODO SS-8052 move into useMemo

	// sort the parameters
	sortedParamsAndExports.sort(
		(a, b) =>
			(typeof a.definition.order === "number"
				? a.definition.order
				: Infinity) -
			(typeof b.definition.order === "number"
				? b.definition.order
				: Infinity),
	); // <-- TODO SS-8052 move into useMemo

	return sortedParamsAndExports;
}
