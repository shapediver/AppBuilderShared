import type {ExecutableSpecificTool} from "@AppBuilderLib/features/agent-tools/config/resolveSpecificTools";
import type {ResolvedGenericTool} from "@AppBuilderLib/features/agent-tools/config/resolveToolset";
import {schemaFor} from "@AppBuilderLib/features/agent-tools/config/schemaFor";
import {AGENT_TOOL_META} from "@AppBuilderLib/features/agent-tools/config/toolMeta";
import type {IToolsApiHandlerMap} from "@AppBuilderLib/features/agent-tools/config/toolsApiConnector";
import {
	zodToJsonSchema,
	type JsonSchema,
} from "@AppBuilderLib/features/agent-tools/lib/zodToJsonSchema";
import type {ModelContext} from "../lib/webmcpAvailability";

/**
 * Register resolved generic tools, then specific tools, on WebMCP.
 * Generic schema lookup lives in agent-tools (`schemaFor`); execute comes from `toolHandlers`.
 * Specific tools use their own `inputSchema` and `execute`.
 */
export async function registerResolvedTools(
	modelContext: ModelContext,
	resolvedGenericTools: ResolvedGenericTool[],
	toolHandlers: IToolsApiHandlerMap,
	signal: AbortSignal,
	resolvedSpecificTools: ExecutableSpecificTool[] = [],
): Promise<void> {
	for (const tool of resolvedGenericTools) {
		const meta = AGENT_TOOL_META[tool.name];
		await modelContext.registerTool(
			{
				name: tool.name,
				description: meta.description,
				inputSchema: zodToJsonSchema(schemaFor(tool.name)),
				execute: toolHandlers[tool.name],
				annotations: {
					readOnlyHint: meta.annotations.readOnlyHint,
					untrustedContentHint: true,
				},
			},
			{signal},
		);
	}
	for (const tool of resolvedSpecificTools) {
		await modelContext.registerTool(
			{
				name: tool.name,
				description: tool.description,
				inputSchema: tool.inputSchema as JsonSchema,
				execute: (input) => tool.execute(input),
				annotations: {
					readOnlyHint: false,
					untrustedContentHint: true,
				},
			},
			{signal},
		);
	}
}
