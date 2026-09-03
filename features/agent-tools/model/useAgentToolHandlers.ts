import {useParameterImportExport} from "@AppBuilderLib/entities/parameter/model/useParameterImportExport";
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";
import {useViewportHistory} from "@AppBuilderLib/entities/viewport/model/useViewportHistory";
import {useViewportId} from "@AppBuilderLib/entities/viewport/model/useViewportId";
import {ComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext";
import type {IAppBuilder} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {
	GenericToolName,
	type GenericToolSettings,
} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";
import {useShapeDiverStoreToolbars} from "@AppBuilderLib/features/appbuilder/model/useShapeDiverStoreToolbars";
import {useCreateModelState} from "@AppBuilderLib/features/model-state/model/useCreateModelState";
import {useImportModelState} from "@AppBuilderLib/features/model-state/model/useImportModelState";
import {useContext, useMemo, useRef} from "react";
import {useShallow} from "zustand/react/shallow";
import {
	defaultSettingsFor,
	isGenericToolSettingsFor,
	type InScopeGenericToolName,
} from "../config/inScopeGenericTools";
import type {ResolvedGenericTool} from "../config/resolveToolset";
import type {IToolsApiHandlerMap} from "../config/toolsApi";
import type {AgentToolsDeps} from "./agentToolsDeps";
import {buildAgentToolsDeps} from "./buildAgentToolsDeps";
import {handleGetMetric} from "./handlers/getMetric";
import {handleGetParameterValues} from "./handlers/getParameterValues";
import {handleGetScreenshot} from "./handlers/getScreenshot";
import {handleListActionControls} from "./handlers/listActionControls";
import {handleListParameterDefinitions} from "./handlers/listParameterDefinitions";
import {handleSetCameraPosition} from "./handlers/setCameraPosition";
import {handleSetParameterValues} from "./handlers/setParameterValues";
import {handleTriggerActionControl} from "./handlers/triggerActionControl";

export type AgentToolHandlerMap = IToolsApiHandlerMap;

/** Settings for this generic tool from the resolved toolset, or `{name}` default. */
function settingsForTool<N extends InScopeGenericToolName>(
	resolvedTools: ResolvedGenericTool[],
	name: N,
): Extract<GenericToolSettings, {name: N}> {
	const found = resolvedTools.find((tool) => tool.name === name);
	if (found && isGenericToolSettingsFor(found.settings, name)) {
		return found.settings;
	}
	return defaultSettingsFor(name);
}

/**
 * Builds the live handler map for in-scope generic tools (parameters, actions,
 * camera, screenshot, metric). Map identity is stable (`useMemo` []); deps are
 * read from a ref so WebMCP and ToolsApi can share one object.
 *
 * This is execution, not transport. {@link useWebMcpTools} and
 * {@link useToolsApiConnector} only register / listen.
 */
export function useAgentToolHandlers(args: {
	namespace: string;
	appBuilderData: IAppBuilder | undefined;
	resolvedTools: ResolvedGenericTool[];
}): AgentToolHandlerMap {
	const {namespace, appBuilderData, resolvedTools} = args;
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

	const resolvedToolsRef = useRef(resolvedTools);
	resolvedToolsRef.current = resolvedTools;

	const depsRef = useRef<AgentToolsDeps>(null!);
	depsRef.current = buildAgentToolsDeps({
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
	});

	return useMemo(
		() => ({
			[GenericToolName.ListParameterDefinitions]: (input) =>
				handleListParameterDefinitions(
					input,
					settingsForTool(
						resolvedToolsRef.current,
						GenericToolName.ListParameterDefinitions,
					),
					depsRef.current,
				),
			[GenericToolName.GetParameterValues]: (input) =>
				handleGetParameterValues(
					input,
					// Sharing ListParameterDefinitions settings is intentional.
					settingsForTool(
						resolvedToolsRef.current,
						GenericToolName.ListParameterDefinitions,
					),
					depsRef.current,
				),
			[GenericToolName.SetParameterValues]: (input) =>
				handleSetParameterValues(input, depsRef.current),
			[GenericToolName.ListActionControls]: (input) =>
				handleListActionControls(
					input,
					settingsForTool(
						resolvedToolsRef.current,
						GenericToolName.ListActionControls,
					),
					depsRef.current,
				),
			[GenericToolName.TriggerActionControl]: (input) =>
				handleTriggerActionControl(
					input,
					// Sharing ListActionControls settings is intentional.
					settingsForTool(
						resolvedToolsRef.current,
						GenericToolName.ListActionControls,
					),
					depsRef.current,
				),
			[GenericToolName.SetCameraPosition]: (input) =>
				handleSetCameraPosition(input, depsRef.current),
			[GenericToolName.GetScreenshot]: (input) =>
				handleGetScreenshot(input, depsRef.current),
			[GenericToolName.GetMetric]: (input) =>
				handleGetMetric(input, depsRef.current),
		}),
		[],
	);
}
