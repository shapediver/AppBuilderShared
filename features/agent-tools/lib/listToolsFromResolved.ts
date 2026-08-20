import type {ResolvedGenericTool} from "../config/resolveToolset";
import {schemaFor} from "../config/schemaFor";
import {AGENT_TOOL_META} from "../config/toolMeta";
import type {IListToolsReply} from "../config/toolsApi";
import {zodToJsonSchema} from "./zodToJsonSchema";

export function listToolsFromResolved(
	resolved: ResolvedGenericTool[],
): IListToolsReply {
	return {
		tools: resolved.map((tool) => ({
			name: tool.name,
			description: AGENT_TOOL_META[tool.name].description,
			inputSchema: zodToJsonSchema(schemaFor(tool.name)),
		})),
	};
}
