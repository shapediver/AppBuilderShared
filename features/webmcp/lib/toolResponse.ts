import {ZodError, type ZodType} from "@AppBuilderLib/shared/lib/zod";

export type ToolContentItem = {
	type: "text";
	text: string;
};

export type ToolResponse = {
	content: ToolContentItem[];
	structuredContent?: Record<string, unknown>;
	isError?: true;
};

export function toolSuccess(
	text: string,
	structuredContent?: Record<string, unknown>,
): ToolResponse {
	return {
		content: [{type: "text", text}],
		...(structuredContent !== undefined ? {structuredContent} : {}),
	};
}

export function toolError(
	text: string,
	structuredContent?: Record<string, unknown>,
): ToolResponse {
	return {
		content: [{type: "text", text}],
		...(structuredContent !== undefined ? {structuredContent} : {}),
		isError: true,
	};
}

export function toolZodError(zodError: ZodError): ToolResponse {
	const path = zodError.issues[0]?.path.join(".") || "input";
	return toolError(
		`Error: Invalid input data.\nRecovery: Fix ${path} and try again.`,
		{error: zodError.issues},
	);
}

/**
 * Parse input with Zod, then run the executor. Zod failures and execution
 * failures use separate try/catch blocks (WebMCP UAT requirement).
 */
export async function runTool<T>(
	schema: ZodType<T>,
	input: unknown,
	executor: (parsed: T) => Promise<ToolResponse> | ToolResponse,
): Promise<ToolResponse> {
	const inputObj = input ?? {};
	let parsed: T;
	try {
		parsed = schema.parse(inputObj);
	} catch (e) {
		if (e instanceof ZodError) {
			return toolZodError(e);
		}
		return toolError(
			`Error: Invalid input data.\nRecovery: Fix input and try again.`,
			{error: e instanceof Error ? e.message : String(e)},
		);
	}

	try {
		return await executor(parsed);
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		return toolError(
			`Error: ${message}\nRecovery: Check the input and try again.`,
			{error: message},
		);
	}
}
