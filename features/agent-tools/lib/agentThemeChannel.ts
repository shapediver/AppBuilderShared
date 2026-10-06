import type {MantineThemeOverride} from "@mantine/core";

/** Host → agent. Carries the applied settings theme file. */
export const AGENT_THEME_MESSAGE = "shapediver:agent-theme";

/** Agent → host. Sent once the chat is listening. */
export const AGENT_THEME_REQUEST = "shapediver:agent-theme-request";

export type AgentThemeMessage = {
	type: typeof AGENT_THEME_MESSAGE;
	themeOverrides: MantineThemeOverride;
};

/** Theme files are JSON. Drop functions so the payload can cross origins. */
export function serializeThemeOverrides(
	theme: MantineThemeOverride | undefined,
): MantineThemeOverride {
	if (!theme) {
		return {};
	}
	try {
		return JSON.parse(JSON.stringify(theme)) as MantineThemeOverride;
	} catch {
		return {};
	}
}

export function isAgentThemeMessage(
	value: unknown,
): value is AgentThemeMessage {
	if (typeof value !== "object" || value === null) {
		return false;
	}
	const record = value as Record<string, unknown>;
	return (
		record.type === AGENT_THEME_MESSAGE &&
		typeof record.themeOverrides === "object" &&
		record.themeOverrides !== null
	);
}

export function postAgentTheme(
	peer: Window,
	agentUrl: string,
	theme: MantineThemeOverride | undefined,
): void {
	let origin: string;
	try {
		origin = new URL(agentUrl).origin;
	} catch {
		return;
	}
	const message: AgentThemeMessage = {
		type: AGENT_THEME_MESSAGE,
		themeOverrides: serializeThemeOverrides(theme),
	};
	peer.postMessage(message, origin);
}
