import type {ExecutableSpecificTool} from "../config/resolveSpecificTools";
import type {ResolvedGenericTool} from "../config/resolveToolset";
import type {IToolsApiHandlerMap} from "../config/toolsApiConnector";

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
 * Unknown `name` (not in `resolvedGenericTools` or `resolvedSpecificTools`) → {@link unknownToolResult}.
 * A specific-tool hit calls that tool's `execute`.
 * Handler throw → `{ success: false, message }` (transports must not throw).
 */
export async function executeResolvedTool(
	name: string,
	input: unknown,
	resolvedGenericTools: ResolvedGenericTool[],
	toolHandlers: IToolsApiHandlerMap,
	resolvedSpecificTools: ExecutableSpecificTool[] = [],
): Promise<unknown> {
	const tool = resolvedGenericTools.find(
		(resolvedTool) => resolvedTool.name === name,
	);
	if (!tool) {
		const specific = resolvedSpecificTools.find(
			(resolvedTool) => resolvedTool.name === name,
		);
		if (!specific) {
			return unknownToolResult(name);
		}
		try {
			return await specific.execute(input);
		} catch (error) {
			return {
				success: false,
				message: error instanceof Error ? error.message : String(error),
			};
		}
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
