import {defaultAgentUrlForEnvironment} from "./defaultAgentUrl";

function nonempty(value: string | null | undefined): string | undefined {
	const trimmed = value?.trim();
	return trimmed ? trimmed : undefined;
}

/**
 * Query `agentUrl` wins except on production and iframe, which always use the
 * environment default. There is no settings or VITE_AGENT_URL fallback.
 */
export function resolveAgentUrl(
	queryAgentUrl: string | null | undefined,
	environmentIdentifier: string,
): string | undefined {
	const fallback = defaultAgentUrlForEnvironment(environmentIdentifier);
	if (
		environmentIdentifier === "production" ||
		environmentIdentifier === "iframe"
	) {
		return fallback;
	}

	return nonempty(queryAgentUrl) ?? fallback;
}
