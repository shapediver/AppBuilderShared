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

export interface WebMcpToolsDeps {
	namespaceRef: MutableRefObject<string>;
	getLiveParameters: (namespace: string) => IShapeDiverParameter<any>[];
	batchParameterValueUpdateRef: MutableRefObject<
		IShapeDiverStoreParameters["batchParameterValueUpdate"]
	>;
	createModelStateRef: MutableRefObject<
		(props: ICreateModelStateData) => Promise<ICreateModelStateResult>
	>;
	importModelStateRef: MutableRefObject<
		(props: IImportModelStateData) => Promise<IImportModelStateResult>
	>;
}
