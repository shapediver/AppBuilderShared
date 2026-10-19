export type AgentUiMode = "iframe" | "window";

export type ResolvedAgentUi = {
	mode: AgentUiMode;
	showThreadHistory: boolean;
	createThreadOnLoad: boolean;
};

function optionalBoolean(value: unknown): boolean | undefined {
	return typeof value === "boolean" ? value : undefined;
}

/**
 * Resolve AgentUi theme props.
 * History and create-on-load default on. The flags are independent.
 */
export function resolveAgentUi(input: {
	mode?: unknown;
	showThreadHistory?: unknown;
	createThreadOnLoad?: unknown;
}): ResolvedAgentUi {
	const mode = input.mode === "window" ? "window" : "iframe";
	return {
		mode,
		showThreadHistory: optionalBoolean(input.showThreadHistory) ?? true,
		createThreadOnLoad: optionalBoolean(input.createThreadOnLoad) ?? true,
	};
}
