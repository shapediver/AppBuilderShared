export const AGENT_WINDOW_NAME = "shapediver-agent";
export const AGENT_WINDOW_FEATURES = "width=520,height=780";

export type OpenWindow = (
	url: string,
	target: string,
	features?: string,
) => Window | null;

export function openAgentWindow(
	url: string,
	open: OpenWindow = (href, target, features) =>
		window.open(href, target, features),
): Window | null {
	return open(url, AGENT_WINDOW_NAME, AGENT_WINDOW_FEATURES);
}
