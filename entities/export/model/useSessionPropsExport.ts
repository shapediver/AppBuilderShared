import {PropsExport} from "@AppBuilderLib/entities/export/config/propsExport";
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {ResExportDefinition} from "@shapediver/sdk.geometry-api-sdk-v2";
import {useMemo} from "react";
import {useShallow} from "zustand/react/shallow";

/**
 * Hook providing a shortcut to create export props for the {@link ParametersAndExportsAccordionComponent}
 * component, for all exports of one or several sessions, using an optional filter.
 * @param namespace
 * @param filter optional filter for export definitions
 * @returns
 */
export function useSessionPropsExport(
	namespace: string | string[],
	filter?: (param: ResExportDefinition) => boolean,
): PropsExport[] {
	const _filter = filter || (() => true);

	// Select a flat list of (namespace, export id) pairs, which the shallow
	// comparison can match. Creating the props objects inside the selector
	// would return a new array on every call and cause an infinite render loop.
	const selection = useShapeDiverStoreParameters(
		useShallow((state) =>
			(Array.isArray(namespace) ? namespace : [namespace]).flatMap(
				(namespace) =>
					Object.values(state.exportStores[namespace] ?? {})
						.map((store) => store.getState().definition)
						.filter((definition) => _filter(definition))
						.flatMap((definition) => [namespace, definition.id]),
			),
		),
	);

	return useMemo(() => {
		const propsExports: PropsExport[] = [];
		for (let i = 0; i < selection.length; i += 2) {
			propsExports.push({
				namespace: selection[i],
				exportId: selection[i + 1],
			});
		}

		return propsExports;
	}, [selection]);
}
