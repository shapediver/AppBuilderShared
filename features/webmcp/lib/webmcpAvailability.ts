export interface ModelContextToolAnnotations {
	readOnlyHint?: boolean;
	consequentialHint?: boolean;
	untrustedContentHint?: boolean;
}

export interface ModelContextRegisterToolOptions {
	signal?: AbortSignal;
	exposedTo?: string[];
}

export interface ModelContextExecuteCallbackOptions {
	signal: AbortSignal;
}

export interface ModelContextRegisterToolParams {
	name: string;
	title?: string;
	description: string;
	inputSchema: object;
	execute: (
		input: unknown,
		options: ModelContextExecuteCallbackOptions,
	) => Promise<unknown>;
	annotations?: ModelContextToolAnnotations;
}

/** Chrome <154 may still stringify; 154+ returns a deep-copied object. */
export type WebMcpToolInputSchema = object | string;

export interface WebMcpRegisteredTool {
	name: string;
	title?: string;
	description?: string;
	inputSchema: WebMcpToolInputSchema;
	origin?: string;
	window?: Window;
	annotations?: ModelContextToolAnnotations;
}

export interface ModelContextGetToolOptions {
	fromOrigins?: string[];
}

export interface ModelContextExecuteToolOptions {
	signal?: AbortSignal;
}

/**
 * Chrome WebMCP `document.modelContext` / `navigator.modelContext`.
 * Mirrors https://developer.chrome.com/docs/ai/webmcp/imperative-api (Chrome 155).
 */
export interface ModelContext extends EventTarget {
	registerTool(
		params: ModelContextRegisterToolParams,
		options?: ModelContextRegisterToolOptions,
	): Promise<void>;
	getTools(
		options?: ModelContextGetToolOptions,
	): Promise<WebMcpRegisteredTool[]>;
	/**
	 * Chrome 155+: optional JSON-serializable object.
	 * JSON strings are deprecated from Chrome 155.
	 */
	executeTool(
		tool: WebMcpRegisteredTool,
		input?: object,
		options?: ModelContextExecuteToolOptions,
	): Promise<unknown>;
	ontoolchange: ((this: ModelContext, event: Event) => unknown) | null;
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

export function isCrossOriginIsolated(): boolean {
	return typeof crossOriginIsolated !== "undefined" && crossOriginIsolated;
}

export function getWebMcpEnvironment(): {
	modelContextAvailable: boolean;
	crossOriginIsolated: boolean;
	ready: boolean;
} {
	const modelContextAvailable = isWebMcpAvailable();
	const coi = isCrossOriginIsolated();

	return {
		modelContextAvailable,
		crossOriginIsolated: coi,
		ready: modelContextAvailable && coi,
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
