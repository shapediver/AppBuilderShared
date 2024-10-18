import { useShallow } from "zustand/react/shallow";
import { useShapeDiverStoreParameters } from "../../../store/useShapeDiverStoreParameters";
import { PropsExport } from "../../../types/components/shapediver/propsExport";
import { PropsParameter } from "../../../types/components/shapediver/propsParameter";
import { IShapeDiverParamOrExportDefinition } from "../../../types/shapediver/common";

/**
 * The definition of a parameter or export, and the corresponding parameter or export properties.
 */
interface ParamOrExportDefinition {
	parameter?: PropsParameter,
	export?: PropsExport,
	definition: IShapeDiverParamOrExportDefinition,
}

/**
 * Hook providing a sorted list of definitions of parameters and exports, used
 * by {@link ParametersAndExportsAccordionComponent} for creating parameter and export UI components. 
 * @param parameters parameter references
 * @param exports export references
 * @returns 
 */
export function useSortedParametersAndExports(parameters?: PropsParameter[], exports?: PropsExport[]) : ParamOrExportDefinition[] {
	
	const {parameterStores, exportStores} = useShapeDiverStoreParameters(
		useShallow(state => ({parameterStores: state.parameterStores, exportStores: state.exportStores}))
	);

	// collect definitions of parameters and exports for sorting and grouping
	let sortedParamsAndExports : ParamOrExportDefinition[] = [];
	sortedParamsAndExports = sortedParamsAndExports.concat((parameters ?? []).flatMap(p => {
		const stores = Object.values(parameterStores[p.namespace] ?? {});
		for (const store of stores) {
			const { definition, acceptRejectMode } = store.getState();
			if (definition.id === p.parameterId || definition.name === p.parameterId || definition.displayname === p.parameterId)
				return { 
					parameter: { 
						...p, 
						// in case the parameter reference defines acceptRejectMode, use it
						// otherwise fall back to acceptRejectMode given by parameter definition
						acceptRejectMode: p.acceptRejectMode === undefined ? acceptRejectMode : p.acceptRejectMode
					}, 
					definition: {
						...definition, 
						...p.overrides
					} 
				};
		}

		return [];
	})); // <-- TODO SS-8052 move into useMemo

	sortedParamsAndExports = sortedParamsAndExports.concat((exports ?? []).flatMap(e => {
		const stores = Object.values(exportStores[e.namespace] ?? {});
		for (const store of stores) {
			const definition = store.getState().definition;
			if (definition.id === e.exportId || definition.name === e.exportId  || definition.displayname === e.exportId )
				return { export: e, definition: {...definition, ...e.overrides} };
		}
		
		return [];
	})); // <-- TODO SS-8052 move into useMemo

	// sort the parameters
	sortedParamsAndExports.sort((a, b) => 
		(typeof a.definition.order === "number" ? a.definition.order : Infinity) 
		- (typeof b.definition.order === "number" ? b.definition.order : Infinity)
	); // <-- TODO SS-8052 move into useMemo

	return sortedParamsAndExports;
}
