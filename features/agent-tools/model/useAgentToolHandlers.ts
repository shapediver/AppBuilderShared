import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";
import {useViewportId} from "@AppBuilderLib/entities/viewport/model/useViewportId";
import {ComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext";
import type {IAppBuilder} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {
	GenericToolName,
	type GenericToolSettings,
} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";
import {useShapeDiverStoreToolbars} from "@AppBuilderLib/features/appbuilder/model/useShapeDiverStoreToolbars";
import {useContext, useMemo, useRef} from "react";
import {useShallow} from "zustand/react/shallow";
import {
	defaultSettingsFor,
	isGenericToolSettingsFor,
	type InScopeGenericToolName,
} from "../config/inScopeGenericTools";
import type {
	ExecutableSpecificTool,
	ResolvedSpecificTool,
} from "../config/resolveSpecificTools";
import type {ResolvedGenericTool} from "../config/resolveToolset";
import type {IToolsApiHandlerMap} from "../config/toolsApiConnector";
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
import {runSpecificTool} from "./runSpecificTool";

export type AgentToolHandlerMap = IToolsApiHandlerMap;

/** Settings for this generic tool from the resolved toolset, or `{name}` default. */
function settingsForTool<N extends InScopeGenericToolName>(
	resolvedGenericTools: ResolvedGenericTool[],
	name: N,
): Extract<GenericToolSettings, {name: N}> {
	const found = resolvedGenericTools.find((tool) => tool.name === name);
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
	resolvedGenericTools: ResolvedGenericTool[];
	resolvedSpecificTools: ResolvedSpecificTool[];
}): {
	toolHandlers: AgentToolHandlerMap;
	resolvedSpecificTools: ExecutableSpecificTool[];
} {
	const {
		namespace,
		appBuilderData,
		resolvedGenericTools,
		resolvedSpecificTools,
	} = args;
	const componentContext = useContext(ComponentContext);
	const {viewportId} = useViewportId();

	const {sessions} = useShapeDiverStoreSession(
		useShallow((state) => ({
			sessions: state.sessions,
		})),
	);

	const {getParameters, batchParameterValueUpdate} =
		useShapeDiverStoreParameters(
			useShallow((state) => ({
				getParameters: state.getParameters,
				batchParameterValueUpdate: state.batchParameterValueUpdate,
			})),
		);

	const defaultToolbars = useShapeDiverStoreToolbars(
		(state) => state.defaultToolbars,
	);

	const resolvedGenericToolsRef = useRef(resolvedGenericTools);
	resolvedGenericToolsRef.current = resolvedGenericTools;

	const depsRef = useRef<AgentToolsDeps>(null!);
	depsRef.current = buildAgentToolsDeps({
		namespace,
		appBuilderData,
		viewportId,
		sessions,
		getParameters,
		batchParameterValueUpdate,
		defaultToolbars,
		componentContext,
	});

	const toolHandlers = useMemo<AgentToolHandlerMap>(
		() => ({
			[GenericToolName.ListParameterDefinitions]: (input) =>
				handleListParameterDefinitions(
					input,
					settingsForTool(
						resolvedGenericToolsRef.current,
						GenericToolName.ListParameterDefinitions,
					),
					depsRef.current,
				),
			[GenericToolName.GetParameterValues]: (input) =>
				handleGetParameterValues(
					input,
					// Sharing ListParameterDefinitions settings is intentional.
					settingsForTool(
						resolvedGenericToolsRef.current,
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
						resolvedGenericToolsRef.current,
						GenericToolName.ListActionControls,
					),
					depsRef.current,
				),
			[GenericToolName.TriggerActionControl]: (input) =>
				handleTriggerActionControl(
					input,
					// Sharing ListActionControls settings is intentional.
					settingsForTool(
						resolvedGenericToolsRef.current,
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

	const executableSpecificTools = resolvedSpecificTools.map((tool) => ({
		...tool,
		execute: (input: unknown) =>
			runSpecificTool(tool, input, depsRef.current),
	}));

	return {toolHandlers, resolvedSpecificTools: executableSpecificTools};
}
