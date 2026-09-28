import type {ResolvedSpecificTool} from "../config/resolveSpecificTools";
import type {ResolvedGenericTool} from "../config/resolveToolset";
import {schemaFor} from "../config/schemaFor";
import {AGENT_TOOL_META} from "../config/toolMeta";
import type {IListToolsReply} from "../config/toolsApi";
import {zodToJsonSchema, type JsonSchema} from "./zodToJsonSchema";

/** Build the `listTools()` payload from the resolved snapshot (no live store reads). */
export function listToolsFromResolved(
	resolvedGenericTools: ResolvedGenericTool[],
	resolvedSpecificTools: ResolvedSpecificTool[] = [],
): IListToolsReply {
	return {
		tools: [
			...resolvedGenericTools.map((tool) => ({
				name: tool.name,
				description: AGENT_TOOL_META[tool.name].description,
				inputSchema: zodToJsonSchema(schemaFor(tool.name)),
			})),
			...resolvedSpecificTools.map((tool) => ({
				name: tool.name,
				description: tool.description,
				inputSchema: tool.inputSchema as JsonSchema,
			})),
		],
	};
}
