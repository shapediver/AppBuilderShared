import {ZodError} from "@AppBuilderLib/shared/lib/zod";
import type {ToolDeps} from "../../core/deps";
import {ToolExecutionError, type AnyToolDef} from "../../core/toolDefinition";
import {ALL_TOOLS} from "../../core/tools";
import type {ModelContext} from "../../lib/webmcpAvailability";
import {zodToJsonSchema} from "./zodToJsonSchema";

type ToolContentItem = {type: "text"; text: string};
type ToolResponse = {
	content: ToolContentItem[];
	structuredContent?: Record<string, unknown>;
	isError?: true;
};

function toolError(
	text: string,
	structuredContent?: Record<string, unknown>,
): ToolResponse {
	return {
		content: [{type: "text", text}],
		...(structuredContent !== undefined ? {structuredContent} : {}),
		isError: true,
	};
}

function toWebMcpError(_tool: AnyToolDef, e: unknown): ToolResponse {
	if (e instanceof ZodError) {
		const path = e.issues[0]?.path.join(".") || "input";
		return toolError(
			`Error: Invalid input data.\nRecovery: Fix ${path} and try again.`,
			{error: e.issues},
		);
	}
	if (e instanceof ToolExecutionError) {
		return toolError(e.message, e.structuredContent ?? {error: e.message});
	}
	const message = e instanceof Error ? e.message : String(e);
	return toolError(message, {error: message});
}

export async function registerWebMcpTools(
	modelContext: ModelContext,
	depsRef: () => ToolDeps,
	signal: AbortSignal,
): Promise<void> {
	for (const tool of ALL_TOOLS) {
		await modelContext.registerTool(
			{
				name: tool.name,
				description: tool.description,
				inputSchema: zodToJsonSchema(tool.inputSchema),
				annotations: tool.annotations ?? {},
				execute: async (rawInput) => {
					const deps = depsRef();
					let parsed: unknown;
					try {
						parsed = tool.inputSchema.parse(rawInput ?? {});
					} catch (e) {
						return toWebMcpError(tool, e);
					}
					try {
						const structured = await tool.execute(
							deps,
							parsed,
							signal,
						);
						const text = tool.format(structured);
						return {
							content: [{type: "text", text}],
							structuredContent: structured as Record<
								string,
								unknown
							>,
						};
					} catch (e) {
						return toWebMcpError(tool, e);
					}
				},
			},
			{signal},
		);
	}
}
