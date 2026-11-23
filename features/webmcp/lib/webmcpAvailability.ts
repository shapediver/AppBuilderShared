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

/**
 * A tool returned by `getTools()`.
 * Chrome 160+ returns `Tool` interface objects (WebMCP spec PR #348); older
 * versions return plain `RegisteredTool` dictionaries.
 * Read attributes explicitly: on a `Tool`, `JSON.stringify` returns "{}",
 * spreading copies nothing and `structuredClone` throws.
 */
export interface WebMcpTool {
	name: string;
	title?: string;
	description?: string;
	/** `null` on Chrome 160+ when not provided. */
	inputSchema: WebMcpToolInputSchema | null;
	/** Chrome 160+; `null` when not provided. */
	outputSchema?: object | null;
	origin?: string;
	/** Window of the document that registered the tool (Chrome 160+). */
	source?: Window | null;
	/**
	 * @deprecated Chrome <160 name of `source`. Read `tool.source ?? tool.window`;
	 * remove once Chrome 160 is stable (2027-01-05).
	 */
	window?: Window;
	/** `null` on Chrome 160+ when not provided. */
	annotations?: ModelContextToolAnnotations | null;
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
	getTools(options?: ModelContextGetToolOptions): Promise<WebMcpTool[]>;
	/**
	 * Chrome 155+: optional JSON-serializable object.
	 * JSON strings are deprecated from Chrome 155.
	 * Chrome 160+ runs exactly the `Tool` object `getTools()` returned, so pass
	 * that object, not a copy.
	 */
	executeTool(
		tool: WebMcpTool,
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
