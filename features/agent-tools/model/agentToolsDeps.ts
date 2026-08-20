import type {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import type {IShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/config/shapediverStoreParameters";
import type {IAppBuilder} from "@AppBuilderLib/features/appbuilder/config/appbuilder";

export type AgentToolsDeps = {
	controllerNamespace: string;
	getLiveParameters: (namespace: string) => IShapeDiverParameter<unknown>[];
	listSessionNamespaces: () => string[];
	getAppBuilder: () => IAppBuilder | undefined;
	batchParameterValueUpdate: IShapeDiverStoreParameters["batchParameterValueUpdate"];
};
