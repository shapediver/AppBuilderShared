import type {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import type {IShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/config/shapediverStoreParameters";
import type {
	IAppBuilder,
	IAppBuilderActionPropsAddToCart,
	IAppBuilderActionPropsCreateModelState,
	IAppBuilderActionPropsImportModelState,
	IAppBuilderActionPropsSound,
	IAppBuilderControlActionRef,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import type {Vec3} from "../config/setCameraPosition";
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
	getViewportId: () => string;
	setCamera: (args: {
		viewportId: string;
		position: Vec3;
		target: Vec3;
	}) => Promise<RunActionControlResult>;
	zoomTo?: (viewportId: string) => Promise<RunActionControlResult>;
	getScreenshot: (viewportId: string) => Promise<string | undefined>;
	getOutputByName: (
		namespace: string,
		name: string,
	) => {content: unknown} | undefined;
	addToCart?: (
		props: IAppBuilderActionPropsAddToCart,
	) => Promise<RunActionControlResult>;
	playSound?: (
		props: IAppBuilderActionPropsSound,
	) => Promise<RunActionControlResult>;
	isCustomComponentContextAction?: (
		action: IAppBuilderControlActionRef,
	) => boolean;
};
