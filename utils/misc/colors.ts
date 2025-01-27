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
