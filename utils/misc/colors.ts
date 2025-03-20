export type ColorFormatType = "hexa" | "rgba";

/**
 * Convert a color string from the ShapeDiver format.
 *
 * @param val - Color in ShapeDiver format ("0xRRGGBBAA")
 * @param format - Format to convert to
 * @returns - Color in rgba format ("rgba(r, g, b, a)") or hexa format ("#RRGGBBAA")
 */
export function convertFromSdColor(val: string, format: ColorFormatType) {
	if (format === "hexa") return val.replace("0x", "#").substring(0, 9);
	else if (format === "rgba") {
		const hex = val.replace("0x", "");
		const r = parseInt(hex.substring(0, 2), 16);
		const g = parseInt(hex.substring(2, 4), 16);
		const b = parseInt(hex.substring(4, 6), 16);
		const a =
			Math.round((parseInt(hex.substring(6, 8), 16) / 255) * 100) / 100;

		return `rgba(${r}, ${g}, ${b}, ${a})`;
	}

	throw new Error(`Invalid color type "${format}".`);
}

/**
 * Convert a color string to the ShapeDiver format.
 *
 * @param val - Color in rgba format ("rgba(r, g, b, a)") or hexa format ("#RRGGBBAA")
 * @param format - Format to convert from
 * @returns - Color in ShapeDiver format (e.g., "0xRRGGBBAA")
 */
export function convertToSdColor(val: string, format: ColorFormatType) {
	if (format === "hexa") return val.replace("#", "0x");
	else if (format === "rgba") {
		const rgba = val.match(
			/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d?\.?\d+))?\)/,
		);
		if (!rgba) return "0x00000000"; // Default to transparent if parsing fails

		const r = parseInt(rgba[1]).toString(16).padStart(2, "0");
		const g = parseInt(rgba[2]).toString(16).padStart(2, "0");
		const b = parseInt(rgba[3]).toString(16).padStart(2, "0");
		const a = Math.round((rgba[4] ? parseFloat(rgba[4]) : 1) * 255)
			.toString(16)
			.padStart(2, "0");

		return `0x${r}${g}${b}${a}`;
	}

	throw new Error(`Invalid color type "${format}".`);
}

/** Decomposed color format */
export type DecomposedColorFormat = {
	/** Red channel value between 0 and 255 */
	red: number;
	/** Green channel value between 0 and 255 */
	green: number;
	/** Blue channel value between 0 and 255 */
	blue: number;
	/** Alpha channel value between 0 and 255 */
	alpha: number;
};

/**
 * Decompose a color string from the ShapeDiver format into its components.
 *
 * @param val - Color in ShapeDiver format ("0xRRGGBBAA")
 * @returns - Color in decomposed format
 */
export function decomposeSdColor(val: string): DecomposedColorFormat {
	const hex = val.replace("0x", "");
	return {
		red: parseInt(hex.substring(0, 2), 16),
		green: parseInt(hex.substring(2, 4), 16),
		blue: parseInt(hex.substring(4, 6), 16),
		alpha: parseInt(hex.substring(6, 8), 16),
	};
}

/**
 * Compose a color string in ShapeDiver format fromt its components.
 *
 * @param val - Color in decomposed format
 * @returns - Color in ShapeDiver format
 */
export function composeSdColor(val: DecomposedColorFormat) {
	const r = val.red.toString(16).padStart(2, "0");
	const g = val.green.toString(16).padStart(2, "0");
	const b = val.blue.toString(16).padStart(2, "0");
	const a = val.alpha.toString(16).padStart(2, "0");

	return `0x${r}${g}${b}${a}`;
}
