export type AgentUiMode = "iframe" | "window";

export type ResolvedAgentUi = {
	mode: AgentUiMode;
	showThreadHistory: boolean;
};

/** Icon for the viewport agent toolbar button. */
export const AGENT_TOOLBAR_ICON = "tabler:message-chatbot";

export function agentToolbarId(viewportId: string | undefined): string {
	return viewportId ? `agentUi-${viewportId}` : "agentUi";
}

export function agentButtonLabel(name: string | undefined): string {
	const trimmed = name?.trim();
	return trimmed ? trimmed : "Agent";
}

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
