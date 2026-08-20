import {useParameterImportExport} from "@AppBuilderLib/entities/parameter/model/useParameterImportExport";
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";
import {useShapeDiverStoreViewport} from "@AppBuilderLib/entities/viewport/model/useShapeDiverStoreViewport";
import {useShapeDiverStoreViewportAccessFunctions} from "@AppBuilderLib/entities/viewport/model/useShapeDiverStoreViewportAccessFunctions";
import {useViewportHistory} from "@AppBuilderLib/entities/viewport/model/useViewportHistory";
import {useViewportId} from "@AppBuilderLib/entities/viewport/model/useViewportId";
import {ComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext";
import type {
	IAppBuilder,
	IAppBuilderActionPropsCreateModelState,
	IAppBuilderActionPropsImportModelState,
	IAppBuilderControlActionRef,
	IAppBuilderToolbarActionItem,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import type {GenericToolSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";
import type {ToolbarRegistration} from "@AppBuilderLib/features/appbuilder/config/shapediverStoreToolbars";
import {useShapeDiverStoreToolbars} from "@AppBuilderLib/features/appbuilder/model/useShapeDiverStoreToolbars";
import type {IImportModelStateData} from "@AppBuilderLib/features/model-state/config/importModelState";
import {useCreateModelState} from "@AppBuilderLib/features/model-state/model/useCreateModelState";
import {useImportModelState} from "@AppBuilderLib/features/model-state/model/useImportModelState";
import {vec3} from "gl-matrix";
import {useContext, useMemo, useRef} from "react";
import {useShallow} from "zustand/react/shallow";
import {
	defaultSettingsFor,
	type InScopeGenericToolName,
} from "../config/inScopeGenericTools";
import type {ResolvedGenericTool} from "../config/resolveToolset";
import type {Vec3} from "../config/setCameraPosition";
import type {RunActionControlResult} from "../config/triggerActionControl";
import type {AgentToolsDeps} from "./agentToolsDeps";
import {handleGetMetric} from "./handlers/getMetric";
import {handleGetParameterValues} from "./handlers/getParameterValues";
import {handleGetScreenshot} from "./handlers/getScreenshot";
import {handleListActionControls} from "./handlers/listActionControls";
import {handleListParameterDefinitions} from "./handlers/listParameterDefinitions";
import {handleSetCameraPosition} from "./handlers/setCameraPosition";
import {handleSetParameterValues} from "./handlers/setParameterValues";
import {handleTriggerActionControl} from "./handlers/triggerActionControl";

export type AgentToolHandlerMap = Record<
	InScopeGenericToolName,
	(input: unknown) => Promise<unknown>
>;

function failureResult(e: unknown): RunActionControlResult {
	return {
		success: false,
		message: e instanceof Error ? e.message : String(e),
	};
}

function settingsNamed<N extends InScopeGenericToolName>(
	resolved: ResolvedGenericTool[],
	name: N,
): Extract<GenericToolSettings, {name: N}> {
	const found = resolved.find((tool) => tool.name === name);
	if (found) {
		return found.settings as Extract<GenericToolSettings, {name: N}>;
	}
	return defaultSettingsFor(name) as Extract<GenericToolSettings, {name: N}>;
}

function flattenDefaultToolbarActions(
	defaultToolbars: ToolbarRegistration[],
): IAppBuilderControlActionRef[] {
	const refs: IAppBuilderControlActionRef[] = [];
	for (const toolbar of defaultToolbars) {
		for (const group of toolbar.groups) {
			for (const item of group) {
				if (item.type !== "action") continue;
				const actionItem = item as IAppBuilderToolbarActionItem;
				refs.push({
					...actionItem.props,
					label: actionItem.label ?? actionItem.props.label,
					icon: actionItem.icon ?? actionItem.props.icon,
					tooltip: actionItem.tooltip ?? actionItem.props.tooltip,
				});
			}
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

export function useAgentToolHandlers(args: {
	namespace: string;
	appBuilderData: IAppBuilder | undefined;
	resolved: ResolvedGenericTool[];
}): AgentToolHandlerMap {
	const {namespace, appBuilderData, resolved} = args;
	const componentContext = useContext(ComponentContext);
	const {viewportId} = useViewportId();
	const {goBack, goForward} = useViewportHistory();
	const {createModelState} = useCreateModelState({namespace});
	const {importModelState} = useImportModelState({namespace});
	const {resetParameters} = useParameterImportExport(namespace);

	const {sessions} = useShapeDiverStoreSession(
		useShallow((state) => ({
			sessions: state.sessions,
		})),
	);

	const {getParameters, batchParameterValueUpdate, getOutput} =
		useShapeDiverStoreParameters(
			useShallow((state) => ({
				getParameters: state.getParameters,
				batchParameterValueUpdate: state.batchParameterValueUpdate,
				getOutput: state.getOutput,
			})),
		);

	const defaultToolbars = useShapeDiverStoreToolbars(
		(state) => state.defaultToolbars,
	);

	const resolvedRef = useRef(resolved);
	resolvedRef.current = resolved;

	const depsRef = useRef<AgentToolsDeps>(null!);
	depsRef.current = {
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

	return useMemo(
		() => ({
			list_parameter_definitions: (input) =>
				handleListParameterDefinitions(
					input,
					settingsNamed(
						resolvedRef.current,
						"list_parameter_definitions",
					),
					depsRef.current,
				),
			get_parameter_values: (input) =>
				handleGetParameterValues(
					input,
					settingsNamed(
						resolvedRef.current,
						"list_parameter_definitions",
					),
					depsRef.current,
				),
			set_parameter_values: (input) =>
				handleSetParameterValues(input, depsRef.current),
			list_action_controls: (input) =>
				handleListActionControls(
					input,
					settingsNamed(resolvedRef.current, "list_action_controls"),
					depsRef.current,
				),
			trigger_action_control: (input) =>
				handleTriggerActionControl(
					input,
					settingsNamed(resolvedRef.current, "list_action_controls"),
					depsRef.current,
				),
			set_camera_position: (input) =>
				handleSetCameraPosition(input, depsRef.current),
			get_screenshot: (input) =>
				handleGetScreenshot(input, depsRef.current),
			get_metric: (input) => handleGetMetric(input, depsRef.current),
		}),
		[],
	);
}
