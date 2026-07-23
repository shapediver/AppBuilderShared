/**
 * Detect whether a source should be rendered as a PDF embed.
 * Prefers MIME type, then data URLs, then .pdf path (query/hash stripped).
 */
export function isPdfSrc(href?: string, contentType?: string): boolean {
	if (contentType === "application/pdf") {
		return true;
	}
	if (!href) {
		return false;
	}
	if (href.startsWith("data:application/pdf")) {
		return true;
	}
	const path = href.split(/[?#]/, 1)[0] ?? href;
	return path.toLowerCase().endsWith(".pdf");
}
