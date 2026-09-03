function nonempty(value: string | null | undefined): boolean {
	return Boolean(value?.trim());
}

/**
 * COOP for the first HTML document.
 * Query `agentUrl` or env `VITE_AGENT_URL` only — settings JSON arrives too late.
 */
export function crossOriginOpenerPolicy(input: {
	queryAgentUrl?: string | null;
	envAgentUrl?: string | null;
}): "same-origin" | "same-origin-allow-popups" {
	return nonempty(input.queryAgentUrl) || nonempty(input.envAgentUrl)
		? "same-origin-allow-popups"
		: "same-origin";
}

export function agentUrlFromRequestUrl(
	requestUrl: string | undefined,
): string | null {
	if (!requestUrl) {
		return null;
	}
	try {
		return new URL(requestUrl, "http://vite.local").searchParams.get(
			"agentUrl",
		);
	} catch {
		return null;
	}
}
