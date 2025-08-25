import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {PropsParameterOrExport} from "@AppBuilderShared/types/components/shapediver/propsCommon";
import {
	IShapeDiverExport,
	IShapeDiverExportDefinition,
} from "@AppBuilderShared/types/shapediver/export";
import {useMemo} from "react";
import {useShallow} from "zustand/react/shallow";

/** Props for multiple exports reference. */
export interface PropsExports extends PropsParameterOrExport {
	/**
	 * Array of export specifications.
	 */
	readonly exports: Array<{
		/** Id, name, or displayname of the export */
		readonly exportId: string;
		/** Properties of the export to be overridden. */
		readonly overrides?: Pick<
			Partial<IShapeDiverExportDefinition>,
			"displayname" | "group" | "order" | "tooltip" | "hidden"
		>;
	}>;
}

/**
 * Hook providing a shortcut to multiple abstracted exports managed by {@link useShapeDiverStoreParameters}.
 *
 * @see {@link PropsExports}
 *
 * @param props Configuration containing namespace and array of export specifications
 * @returns Array of exports with the same order as provided in props.exports
 */
export function useExports(props: PropsExports) {
	const {namespace, exports} = props;
	const parameters = useShapeDiverStoreParameters(
		useShallow((state) => {
			return exports.map(({exportId}) => {
				const parameter = state.getExport(namespace, exportId)!(
					(state) => state as IShapeDiverExport,
				);
				return parameter;
			});
		}),
	);

	const memoizedParameters = useMemo(() => {
		return parameters.map((parameter, index) => ({
			...parameter,
			definition: {...parameter.definition, ...exports[index].overrides},
		}));
	}, [parameters, exports]);

	return memoizedParameters;
}
