import type {IShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/config/shapediverStoreParameters";
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import type {IShapeDiverStoreSessions} from "@AppBuilderLib/entities/session/config/shapediverStoreSession";
import {useShapeDiverStoreViewport} from "@AppBuilderLib/entities/viewport/model/useShapeDiverStoreViewport";
import {useShapeDiverStoreViewportAccessFunctions} from "@AppBuilderLib/entities/viewport/model/useShapeDiverStoreViewportAccessFunctions";
import type {
	IAppBuilder,
	IAppBuilderActionPropsCreateModelState,
	IAppBuilderActionPropsImportModelState,
	IAppBuilderControlActionRef,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import type {IComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext.types";
import type {ToolbarRegistration} from "@AppBuilderLib/features/appbuilder/config/shapediverStoreToolbars";
import type {ICreateModelStateResult} from "@AppBuilderLib/features/model-state/config/createModelState";
import type {
	IImportModelStateData,
	IImportModelStateResult,
} from "@AppBuilderLib/features/model-state/config/importModelState";
import {vec3} from "gl-matrix";
import type {Vec3} from "../config/setCameraPosition";
import type {RunActionControlResult} from "../config/triggerActionControl";
import {collectFromToolbarItems} from "../lib/collectActionControls";
import type {AgentToolsDeps} from "./agentToolsDeps";

export type BuildAgentToolsDepsArgs = {
	namespace: string;
	appBuilderData: IAppBuilder | undefined;
	viewportId: string;
	goBack: () => void;
	goForward: () => void;
	createModelState: (
		props: IAppBuilderActionPropsCreateModelState,
	) => Promise<ICreateModelStateResult>;
	importModelState: (
		props: IImportModelStateData,
	) => Promise<IImportModelStateResult>;
	resetParameters: () => Promise<void>;
	sessions: IShapeDiverStoreSessions;
	getParameters: IShapeDiverStoreParameters["getParameters"];
	batchParameterValueUpdate: IShapeDiverStoreParameters["batchParameterValueUpdate"];
	getOutput: IShapeDiverStoreParameters["getOutput"];
	defaultToolbars: ToolbarRegistration[];
	componentContext: IComponentContext;
};

function failureResult(e: unknown): RunActionControlResult {
	return {
		success: false,
		message: e instanceof Error ? e.message : String(e),
	};
}

function flattenDefaultToolbarActions(
	defaultToolbars: ToolbarRegistration[],
): IAppBuilderControlActionRef[] {
	const refs: IAppBuilderControlActionRef[] = [];
	for (const toolbar of defaultToolbars) {
		for (const group of toolbar.groups) {
			refs.push(...collectFromToolbarItems(group));
		}
	}
	return refs;
}

async function setViewportCamera(args: {
	viewportId: string;
	position: Vec3;
	target: Vec3;
}): Promise<RunActionControlResult> {
	const camera =
		useShapeDiverStoreViewport.getState().viewports[args.viewportId]
			?.camera;
	if (!camera) {
		return {success: false, message: "Viewport not found."};
	}
	camera.position = vec3.fromValues(
		args.position.x,
		args.position.y,
		args.position.z,
	);
	camera.target = vec3.fromValues(
		args.target.x,
		args.target.y,
		args.target.z,
	);
	return {success: true};
}

export function buildAgentToolsDeps(
	args: BuildAgentToolsDepsArgs,
): AgentToolsDeps {
	const {
		namespace,
		appBuilderData,
		viewportId,
		goBack,
		goForward,
		createModelState,
		importModelState,
		resetParameters,
		sessions,
		getParameters,
		batchParameterValueUpdate,
		getOutput,
		defaultToolbars,
		componentContext,
	} = args;

	return {
		controllerNamespace: namespace,
		getLiveParameters: (targetNamespace) =>
			Object.values(getParameters(targetNamespace)).map((store) =>
				store.getState(),
			),
		listSessionNamespaces: () => [
			...new Set([
				...Object.keys(sessions),
				...Object.keys(
					useShapeDiverStoreParameters.getState().parameterStores,
				),
			]),
		],
		getAppBuilder: () => appBuilderData,
		batchParameterValueUpdate,
		getDefaultToolbarActions: () =>
			flattenDefaultToolbarActions(defaultToolbars),
		createModelState: async (
			props: IAppBuilderActionPropsCreateModelState,
		) => {
			try {
				const result = await createModelState(props);
				if (!result.modelStateId) {
					return {
						success: false,
						message: "Failed to create model state.",
					};
				}
				return {success: true};
			} catch (e) {
				return failureResult(e);
			}
		},
		importModelState: async (
			props: IAppBuilderActionPropsImportModelState,
		) => {
			try {
				const result = await importModelState(
					props as IImportModelStateData,
				);
				if (result.success === false) {
					return {success: false, message: result.message};
				}
				return {success: true};
			} catch (e) {
				return failureResult(e);
			}
		},
		undo: async () => {
			goBack();
			return {success: true};
		},
		redo: async () => {
			goForward();
			return {success: true};
		},
		resetParameters: async () => {
			try {
				await resetParameters();
				return {success: true};
			} catch (e) {
				return failureResult(e);
			}
		},
		getViewportId: () => viewportId,
		setCamera: setViewportCamera,
		getScreenshot: async (id) => {
			const getScreenshot =
				useShapeDiverStoreViewportAccessFunctions.getState()
					.viewportAccessFunctions[id]?.getScreenshot;
			return getScreenshot ? await getScreenshot() : undefined;
		},
		getOutputByName: (ns, name) => {
			const store = getOutput(ns, name);
			if (!store) return undefined;
			return {content: store.getState().content};
		},
		isCustomComponentContextAction: (action) => {
			const actions = componentContext.actions;
			if (!actions) return false;
			return Object.values(actions).some((entry) =>
				entry.isAction(action.definition),
			);
		},
	};
}
