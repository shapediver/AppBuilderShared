import {getMetricInputSchema} from "@AppBuilderLib/features/agent-tools/config/getMetric";
import {getParameterValuesInputSchema} from "@AppBuilderLib/features/agent-tools/config/getParameterValues";
import {getScreenshotInputSchema} from "@AppBuilderLib/features/agent-tools/config/getScreenshot";
import {InScopeGenericToolName} from "@AppBuilderLib/features/agent-tools/config/inScopeGenericTools";
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

export const INPUT_SCHEMA_BY_TOOL: Record<InScopeGenericToolName, z.ZodType> = {
	[InScopeGenericToolName.ListParameterDefinitions]:
		listParameterDefinitionsInputSchema,
	[InScopeGenericToolName.GetParameterValues]: getParameterValuesInputSchema,
	[InScopeGenericToolName.SetParameterValues]: setParameterValuesInputSchema,
	[InScopeGenericToolName.ListActionControls]: listActionControlsInputSchema,
	[InScopeGenericToolName.TriggerActionControl]:
		triggerActionControlInputSchema,
	[InScopeGenericToolName.SetCameraPosition]: setCameraPositionInputSchema,
	[InScopeGenericToolName.GetScreenshot]: getScreenshotInputSchema,
	[InScopeGenericToolName.GetMetric]: getMetricInputSchema,
};

/**
 * Register each resolved generic tool on WebMCP.
 * Schema map stays here; execute comes from `handlers` (agent-tools).
 */
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
				inputSchema: zodToJsonSchema(INPUT_SCHEMA_BY_TOOL[tool.name]),
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
