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

export interface ToolDeps {
	namespace: string;
	getLiveParameters: (namespace: string) => IShapeDiverParameter<any>[];
	listParameterNamespaces: () => string[];
	batchParameterValueUpdate: IShapeDiverStoreParameters["batchParameterValueUpdate"];
	createModelState: (
		props: ICreateModelStateData,
	) => Promise<ICreateModelStateResult>;
	importModelState: (
		props: IImportModelStateData,
	) => Promise<IImportModelStateResult>;
}
