import type {ResolvedGenericTool} from "../config/resolveToolset";
import type {IToolsApiHandlerMap} from "../config/toolsApi";

export function unknownToolResult(name: string): {
	success: false;
	message: string;
} {
	return {
		success: false,
		message: `Tool "${name}" does not exist.`,
	};
}

/**
 * Dispatch one ToolsApi / WebMCP execute to the handler map.
 *
 * Unknown `name` (not in `resolvedTools`) → {@link unknownToolResult}.
 * Handler throw → `{ success: false, message }` (transports must not throw).
 */
export async function executeResolvedTool(
	name: string,
	input: unknown,
	resolvedTools: ResolvedGenericTool[],
	toolHandlers: IToolsApiHandlerMap,
): Promise<unknown> {
	const tool = resolvedTools.find(
		(resolvedTool) => resolvedTool.name === name,
	);
	if (!tool) {
		return unknownToolResult(name);
	}
	try {
		return await toolHandlers[tool.name](input);
	} catch (error) {
		return {
			success: false,
			message: error instanceof Error ? error.message : String(error),
		};
	}
}
