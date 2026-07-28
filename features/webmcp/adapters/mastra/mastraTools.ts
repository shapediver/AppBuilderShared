import {createTool} from "@mastra/core/tools";
import type {ToolDeps} from "../../core/deps";
import {ALL_TOOLS} from "../../core/tools";

export function buildMastraTools(deps: ToolDeps) {
	const tools: Record<string, ReturnType<typeof createTool>> = {};
	for (const tool of ALL_TOOLS) {
		tools[tool.name] = createTool({
			id: tool.name,
			description: tool.description,
			inputSchema: tool.inputSchema,
			outputSchema: tool.outputSchema,
			execute: async (
				input: unknown,
				context: {abortSignal?: AbortSignal},
			) =>
				tool.execute(
					deps,
					input as never,
					context.abortSignal ?? new AbortController().signal,
				),
			toModelOutput: (output: unknown) => ({
				type: "content",
				value: [
					{
						type: "text",
						text: tool.format(output as never),
					},
				],
			}),
		});
	}
	return tools;
}
