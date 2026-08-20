import {getMetricInputSchema} from "@AppBuilderLib/features/agent-tools/config/getMetric";
import {getParameterValuesInputSchema} from "@AppBuilderLib/features/agent-tools/config/getParameterValues";
import {getScreenshotInputSchema} from "@AppBuilderLib/features/agent-tools/config/getScreenshot";
import type {InScopeGenericToolName} from "@AppBuilderLib/features/agent-tools/config/inScopeGenericTools";
import {listActionControlsInputSchema} from "@AppBuilderLib/features/agent-tools/config/listActionControls";
import {listParameterDefinitionsInputSchema} from "@AppBuilderLib/features/agent-tools/config/listParameterDefinitions";
import type {ResolvedGenericTool} from "@AppBuilderLib/features/agent-tools/config/resolveToolset";
import {setCameraPositionInputSchema} from "@AppBuilderLib/features/agent-tools/config/setCameraPosition";
import {setParameterValuesInputSchema} from "@AppBuilderLib/features/agent-tools/config/setParameterValues";
import {AGENT_TOOL_META} from "@AppBuilderLib/features/agent-tools/config/toolMeta";
import {triggerActionControlInputSchema} from "@AppBuilderLib/features/agent-tools/config/triggerActionControl";
import type {AgentToolHandlerMap} from "@AppBuilderLib/features/agent-tools/model/useAgentToolHandlers";
import type {z} from "zod";
import type {ModelContext} from "../lib/webmcpAvailability";
import {zodToJsonSchema} from "../lib/zodToJsonSchema";

function schemaFor(name: InScopeGenericToolName): z.ZodType {
	switch (name) {
		case "list_parameter_definitions":
			return listParameterDefinitionsInputSchema;
		case "get_parameter_values":
			return getParameterValuesInputSchema;
		case "set_parameter_values":
			return setParameterValuesInputSchema;
		case "list_action_controls":
			return listActionControlsInputSchema;
		case "trigger_action_control":
			return triggerActionControlInputSchema;
		case "set_camera_position":
			return setCameraPositionInputSchema;
		case "get_screenshot":
			return getScreenshotInputSchema;
		case "get_metric":
			return getMetricInputSchema;
	}
}

export async function registerResolvedTools(
	modelContext: ModelContext,
	resolved: ResolvedGenericTool[],
	handlers: AgentToolHandlerMap,
	signal: AbortSignal,
): Promise<void> {
	for (const tool of resolved) {
		const meta = AGENT_TOOL_META[tool.name];
		await modelContext.registerTool(
			{
				name: tool.name,
				description: meta.description,
				inputSchema: zodToJsonSchema(schemaFor(tool.name)),
				execute: handlers[tool.name],
				annotations: {
					readOnlyHint: meta.annotations.readOnlyHint,
					untrustedContentHint: true,
				},
			},
			{signal},
		);
	}
}
