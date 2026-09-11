export interface ModelContextToolAnnotations {
	readOnlyHint?: boolean;
	untrustedContentHint?: boolean;
}

export interface ModelContextRegisterToolOptions {
	signal?: AbortSignal;
	exposedTo?: string[];
}

export interface ModelContextRegisterToolParams {
	name: string;
	description: string;
	inputSchema: object;
	execute: (input: unknown) => Promise<unknown>;
	annotations?: ModelContextToolAnnotations;
}

/** Chrome <154 may still stringify; 154+ returns a deep-copied object. */
export type WebMcpToolInputSchema = object | string;

export interface WebMcpRegisteredTool {
	name: string;
	description?: string;
	inputSchema: WebMcpToolInputSchema;
}

export interface ModelContext {
	registerTool(
		params: ModelContextRegisterToolParams,
		options?: ModelContextRegisterToolOptions,
	): Promise<void>;
	getTools(): WebMcpRegisteredTool[];
	executeTool(
		tool: WebMcpRegisteredTool | unknown,
		jsonString: string,
	): Promise<unknown>;
}

function getModelContextHost():
	| (Document & {modelContext: ModelContext})
	| (Navigator & {modelContext: ModelContext})
	| undefined {
	if (typeof document !== "undefined" && "modelContext" in document) {
		return document as Document & {modelContext: ModelContext};
	}
	if (typeof navigator !== "undefined" && "modelContext" in navigator) {
		return navigator as Navigator & {modelContext: ModelContext};
	}

	return undefined;
}

export function isWebMcpAvailable(): boolean {
	return getModelContextHost() !== undefined;
}

export function getWebMcpEnvironment(): {
	modelContextAvailable: boolean;
	ready: boolean;
} {
	const modelContextAvailable = isWebMcpAvailable();

	return {
		modelContextAvailable,
		ready: modelContextAvailable,
	};
}

export function getModelContext(): ModelContext {
	const host = getModelContextHost();
	if (!host) {
		throw new Error(
			"WebMCP modelContext is not available in this browser.",
		);
	}

	return host.modelContext;
}
