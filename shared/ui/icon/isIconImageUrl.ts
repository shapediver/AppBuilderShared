const IMAGE_DATA_URI = /^data:image\/[a-z0-9.+-]+/i;
const NETWORK_OR_BLOB_URL = /^(https?:|blob:)/i;
const PROTOCOL_RELATIVE_URL = /^\/\//;
const ABSOLUTE_OR_RELATIVE_PATH = /^(\/|\.\/|\.\.\/)/;
const IMAGE_FILE_EXTENSION = /\.(avif|bmp|gif|ico|jpe?g|png|svg|webp)(\?|#|$)/i;

/**
 * True when an icon string should be rendered as an image instead of an Iconify name.
 * Accepts http(s), blob, data:image/*, protocol-relative, root/relative paths, and
 * common image file extensions (including SVG).
 */
export function isIconImageUrl(value: string): boolean {
	const icon = value.trim();
	if (!icon) {
		return false;
	}

	if (IMAGE_DATA_URI.test(icon)) {
		return true;
	}

	if (icon.toLowerCase().startsWith("data:")) {
		return false;
	}

	return (
		NETWORK_OR_BLOB_URL.test(icon) ||
		PROTOCOL_RELATIVE_URL.test(icon) ||
		ABSOLUTE_OR_RELATIVE_PATH.test(icon) ||
		IMAGE_FILE_EXTENSION.test(icon)
	);
}
