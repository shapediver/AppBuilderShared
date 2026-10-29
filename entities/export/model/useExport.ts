import {PropsExport} from "@AppBuilderLib/entities/export/config/propsExport";
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {useMemo} from "react";
import {createStore, StoreApi, useStore} from "zustand";
import {IShapeDiverExport} from "../config/export";

const noExportStore = createStore<IShapeDiverExport | undefined>(
	() => undefined,
);

/**
 * Hook providing a shortcut to abstracted exports managed by {@link useShapeDiverStoreParameters}.
 *
 * @see {@link PropsExport}
 *
 * @param namespace
 * @param exportId Id, name, or displayname of the export
 * @returns
 */
export function useExport(props: PropsExport) {
	const {namespace, exportId} = props;
	// Select the export store first and subscribe to it outside of the
	// selector: hooks must not be called inside a store selector. Until the
	// export is registered, subscribe to a placeholder store instead, so the
	// hook is called unconditionally.
	const exportStore = useShapeDiverStoreParameters((state) =>
		state.getExport(namespace, exportId),
	);
	const parameter = useStore(
		(exportStore as StoreApi<IShapeDiverExport | undefined>) ??
			noExportStore,
	);

	const memoizedParameter = useMemo(() => {
		return parameter
			? {
					...parameter,
					definition: {...parameter.definition, ...props.overrides},
				}
			: undefined;
	}, [parameter, props.overrides]);

	return memoizedParameter;
}
