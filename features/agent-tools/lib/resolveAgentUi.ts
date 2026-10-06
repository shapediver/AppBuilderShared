export type AgentUiMode = "iframe" | "window";

export type ResolvedAgentUi = {
	mode: AgentUiMode;
	showThreadHistory: boolean;
};

/**
 * Resolve AgentUi theme props.
 * `showThreadHistory` follows mode only when the theme value is omitted.
 */
export function resolveAgentUi(input: {
	mode?: unknown;
	showThreadHistory?: unknown;
}): ResolvedAgentUi {
	const mode = input.mode === "window" ? "window" : "iframe";
	const showThreadHistory =
		typeof input.showThreadHistory === "boolean"
			? input.showThreadHistory
			: mode === "window";
	return {mode, showThreadHistory};
}
