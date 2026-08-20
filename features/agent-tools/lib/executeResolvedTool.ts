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

export async function executeResolvedTool(
	name: string,
	input: unknown,
	resolved: ResolvedGenericTool[],
	handlers: IToolsApiHandlerMap,
): Promise<unknown> {
	const tool = resolved.find((entry) => entry.name === name);
	if (!tool) {
		return unknownToolResult(name);
	}
	try {
		return await handlers[tool.name](input);
	} catch (e) {
		return {
			success: false,
			message: e instanceof Error ? e.message : String(e),
		};
	}
}
