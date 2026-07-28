import type {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import type {IShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/config/shapediverStoreParameters";
import type {
	ICreateModelStateData,
	ICreateModelStateResult,
} from "@AppBuilderLib/features/model-state/config/createModelState";
import type {
	IImportModelStateData,
	IImportModelStateResult,
} from "@AppBuilderLib/features/model-state/config/importModelState";
import type {MutableRefObject} from "react";
import type {ToolDeps} from "../../core/deps";

export interface WebMcpToolsRefs {
	namespaceRef: MutableRefObject<string>;
	getParametersRef: MutableRefObject<
		(
			namespace: string,
		) => Record<string, {getState: () => IShapeDiverParameter<any>}>
	>;
	batchParameterValueUpdateRef: MutableRefObject<
		IShapeDiverStoreParameters["batchParameterValueUpdate"]
	>;
	createModelStateRef: MutableRefObject<
		(props: ICreateModelStateData) => Promise<ICreateModelStateResult>
	>;
	importModelStateRef: MutableRefObject<
		(props: IImportModelStateData) => Promise<IImportModelStateResult>
	>;
	listParameterNamespaces: () => string[];
}

export function buildWebMcpDeps(refs: WebMcpToolsRefs): ToolDeps {
	return {
		namespace: refs.namespaceRef.current,
		getLiveParameters: (ns) =>
			Object.values(refs.getParametersRef.current(ns)).map((s) =>
				s.getState(),
			),
		listParameterNamespaces: refs.listParameterNamespaces,
		batchParameterValueUpdate: refs.batchParameterValueUpdateRef.current,
		createModelState: refs.createModelStateRef.current,
		importModelState: refs.importModelStateRef.current,
	};
}
