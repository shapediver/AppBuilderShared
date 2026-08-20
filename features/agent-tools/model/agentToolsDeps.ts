import type {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import type {IShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/config/shapediverStoreParameters";
import type {
	IAppBuilder,
	IAppBuilderActionPropsAddToCart,
	IAppBuilderActionPropsCreateModelState,
	IAppBuilderActionPropsImportModelState,
	IAppBuilderActionPropsSound,
	IAppBuilderControlActionRef,
	IAppBuilderPropsSetCamera,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import type {RunActionControlResult} from "../config/triggerActionControl";

export type AgentToolsDeps = {
	controllerNamespace: string;
	getLiveParameters: (namespace: string) => IShapeDiverParameter<unknown>[];
	listSessionNamespaces: () => string[];
	getAppBuilder: () => IAppBuilder | undefined;
	batchParameterValueUpdate: IShapeDiverStoreParameters["batchParameterValueUpdate"];
	getDefaultToolbarActions: () => IAppBuilderControlActionRef[];
	createModelState: (
		props: IAppBuilderActionPropsCreateModelState,
	) => Promise<RunActionControlResult>;
	importModelState: (
		props: IAppBuilderActionPropsImportModelState,
	) => Promise<RunActionControlResult>;
	undo: () => Promise<RunActionControlResult>;
	redo: () => Promise<RunActionControlResult>;
	resetParameters: (namespace: string) => Promise<RunActionControlResult>;
	setCamera: (
		props: Pick<IAppBuilderPropsSetCamera, "position" | "target">,
	) => Promise<RunActionControlResult>;
	addToCart?: (
		props: IAppBuilderActionPropsAddToCart,
	) => Promise<RunActionControlResult>;
	playSound?: (
		props: IAppBuilderActionPropsSound,
	) => Promise<RunActionControlResult>;
};
