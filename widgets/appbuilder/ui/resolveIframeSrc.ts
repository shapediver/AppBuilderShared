/**
 * Absolute http(s) URL for an iframe widget.
 * Empty and non-http(s) values are rejected.
 */
export function resolveIframeSrc(url: string | undefined): string | undefined {
	const trimmed = url?.trim();
	if (!trimmed) {
		return undefined;
	}
	let parsed: URL;
	try {
		parsed = new URL(trimmed);
	} catch {
		return undefined;
	}
	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
		return undefined;
	}
	return parsed.toString();
}
