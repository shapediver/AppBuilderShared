/** Fetches a database file as UTF-8 text from a public or root-relative URL. */
export async function fetchText(href: string, label = "data"): Promise<string> {
	const res = await fetch(href);
	if (!res.ok) {
		throw new Error(
			`Failed to fetch ${label}: ${res.status} ${res.statusText}`,
		);
	}
	return res.text();
}
