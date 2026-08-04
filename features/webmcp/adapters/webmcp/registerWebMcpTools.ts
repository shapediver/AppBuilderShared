import {ZodError, type ZodType} from "@AppBuilderLib/shared/lib/zod";
import type {ToolDeps} from "../../core/deps";
import {ToolExecutionError, type AnyToolDef} from "../../core/toolDefinition";
import {ALL_TOOLS} from "../../core/tools";
import type {ModelContext} from "../../lib/webmcpAvailability";

/**
 * Zod 4 native JSON Schema export. Surfaces per-property `.describe()` text
 * and numeric bounds (`integer`/`minimum`/`maximum`) that the hand-rolled
 * converter silently dropped under Zod 4. Top-level `$schema` is stripped to
 * keep the payload minimal and match what WebMCP `registerTool` consumed before.
 */
function toInputJsonSchema(schema: ZodType): object {
	const json = schema.toJSONSchema({target: "draft-07"}) as {
		$schema?: string;
		[k: string]: unknown;
	};
	delete json.$schema;
	return json;
}
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
				inputSchema: toInputJsonSchema(tool.inputSchema),
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
