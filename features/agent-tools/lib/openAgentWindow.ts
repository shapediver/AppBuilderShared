export const AGENT_WINDOW_NAME = "shapediver-agent";

export type OpenWindow = (url: string, target: string) => Window | null;

export function openAgentWindow(
	url: string,
	open: OpenWindow = (href, target) => window.open(href, target),
): Window | null {
	return open(url, AGENT_WINDOW_NAME);
}
