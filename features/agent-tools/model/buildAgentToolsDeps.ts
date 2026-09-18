import type {IShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/config/shapediverStoreParameters";
import {getOutputContent} from "@AppBuilderLib/entities/parameter/lib/getOutputContent";
import {resetParameterValues} from "@AppBuilderLib/entities/parameter/lib/parameterImportExport";
import {
	redoParameterHistory,
	undoParameterHistory,
} from "@AppBuilderLib/entities/parameter/lib/undoRedoParameters";
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import type {IShapeDiverStoreSessions} from "@AppBuilderLib/entities/session/config/shapediverStoreSession";
import {useShapeDiverStoreViewportAccessFunctions} from "@AppBuilderLib/entities/viewport/model/useShapeDiverStoreViewportAccessFunctions";
import {
	isCameraAction,
	type IAppBuilder,
	type IAppBuilderActionDefinition,
	type IAppBuilderActionPropsCreateModelState,
	type IAppBuilderActionPropsImportModelState,
	type IAppBuilderControlActionRef,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {AppBuilderActionType} from "@AppBuilderLib/features/appbuilder/config/appBuilderActionType";
import type {IComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext.types";
import type {ToolbarRegistration} from "@AppBuilderLib/features/appbuilder/config/shapediverStoreToolbars";
import {addToCartFromStores} from "@AppBuilderLib/features/appbuilder/model/runAppBuilderActionAddToCart";
import {createModelStateFromStores} from "@AppBuilderLib/features/appbuilder/model/runAppBuilderActionCreateModelState";
import {runAppBuilderActionSound} from "@AppBuilderLib/features/appbuilder/model/runAppBuilderActionSound";
import type {IImportModelStateData} from "@AppBuilderLib/features/model-state/config/importModelState";
import {importModelStateFromStore} from "@AppBuilderLib/features/model-state/lib/importModelStateFromStore";
import type {Vec3} from "../config/setCameraPosition";
import type {RunActionControlResult} from "../config/triggerActionControl";
import {collectFromToolbarItems} from "../lib/collectActionControls";
import type {AgentToolsDeps} from "./agentToolsDeps";

export type BuildAgentToolsDepsArgs = {
	namespace: string;
	appBuilderData: IAppBuilder | undefined;
	viewportId: string;
	sessions: IShapeDiverStoreSessions;
	getParameters: IShapeDiverStoreParameters["getParameters"];
	batchParameterValueUpdate: IShapeDiverStoreParameters["batchParameterValueUpdate"];
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

async function runHostCamera(
	componentContext: IComponentContext,
	definition: IAppBuilderActionDefinition,
	namespace: string,
	fallbackViewportId: string,
): Promise<RunActionControlResult> {
	const run = componentContext.actions?.camera?.run;
	if (!run) {
		return {success: false, message: "camera is not available"};
	}
	try {
		await run(definition, {
			namespace,
			viewportId: isCameraAction(definition)
				? (definition.props.viewportId ?? fallbackViewportId)
				: fallbackViewportId,
		});
		return {success: true};
	} catch (e) {
		return failureResult(e);
	}
}

async function setViewportCamera(
	componentContext: IComponentContext,
	namespace: string,
	args: {
		viewportId: string;
		position: Vec3;
		target: Vec3;
	},
): Promise<RunActionControlResult> {
	return runHostCamera(
		componentContext,
		{
			type: AppBuilderActionType.Camera,
			props: {
				type: "set",
				viewportId: args.viewportId,
				props: {
					position: [
						args.position.x,
						args.position.y,
						args.position.z,
					],
					target: [args.target.x, args.target.y, args.target.z],
				},
			},
		},
		namespace,
		args.viewportId,
	);
}

/** Wire ShapeDiver stores into `AgentToolsDeps` for tool handlers. */
export function buildAgentToolsDeps(
	args: BuildAgentToolsDepsArgs,
): AgentToolsDeps {
	const {
		namespace,
		appBuilderData,
		viewportId,
		sessions,
		getParameters,
		batchParameterValueUpdate,
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
				const result = await createModelStateFromStores(
					namespace,
					viewportId,
					props,
				);
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
			props:
				| IImportModelStateData
				| IAppBuilderActionPropsImportModelState,
		) => {
			try {
				const result = await importModelStateFromStore(
					namespace,
					props as IImportModelStateData,
				);
				if (!result.success) {
					return {success: false, message: result.message};
				}
				return {success: true};
			} catch (e) {
				return failureResult(e);
			}
		},
		undo: async () => undoParameterHistory(namespace),
		redo: async () => redoParameterHistory(namespace),
		resetParameters: async () => {
			try {
				await resetParameterValues(namespace, {notify: false});
				return {success: true};
			} catch (e) {
				return failureResult(e);
			}
		},
		getViewportId: () => viewportId,
		setCamera: (args) =>
			setViewportCamera(componentContext, namespace, args),
		runCameraAction: (definition) =>
			runHostCamera(componentContext, definition, namespace, viewportId),
		addToCart: async (props) => {
			try {
				await addToCartFromStores(props, {
					namespace,
					viewportId,
				});
				return {success: true};
			} catch (e) {
				return failureResult(e);
			}
		},
		playSound: async (props) => {
			try {
				await runAppBuilderActionSound(props);
				return {success: true};
			} catch (e) {
				return failureResult(e);
			}
		},
		getScreenshot: async (id, props) => {
			const getScreenshot =
				useShapeDiverStoreViewportAccessFunctions.getState()
					.viewportAccessFunctions[id]?.getScreenshot;
			return getScreenshot ? await getScreenshot(props) : undefined;
		},
		getOutputByName: (ns, name) => {
			const result = getOutputContent(ns, name);
			if (!result.found) return undefined;
			return {content: result.content};
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
