function nonempty(value: string | null | undefined): string | undefined {
	const trimmed = value?.trim();
	return trimmed ? trimmed : undefined;
}

export function resolveAgentUrl(
	queryAgentUrl: string | null | undefined,
	settingsAgentUrl: string | null | undefined,
): string | undefined {
	return nonempty(queryAgentUrl) ?? nonempty(settingsAgentUrl);
}
