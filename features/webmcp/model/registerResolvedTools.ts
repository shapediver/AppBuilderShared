import type {ResolvedGenericTool} from "@AppBuilderLib/features/agent-tools/config/resolveToolset";
import {schemaFor} from "@AppBuilderLib/features/agent-tools/config/schemaFor";
import {AGENT_TOOL_META} from "@AppBuilderLib/features/agent-tools/config/toolMeta";
import {zodToJsonSchema} from "@AppBuilderLib/features/agent-tools/lib/zodToJsonSchema";
import type {IToolsApiHandlerMap} from "@AppBuilderLib/features/agent-tools/config/toolsApi";
import type {ModelContext} from "../lib/webmcpAvailability";

/**
 * Register each resolved generic tool on WebMCP.
 * Schema lookup lives in agent-tools (`schemaFor`); execute comes from `handlers`.
 */
export async function registerResolvedTools(
	modelContext: ModelContext,
	resolved: ResolvedGenericTool[],
	handlers: IToolsApiHandlerMap,
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
