import {
	DEFAULT_THEME,
	type MantineColorShade,
	type MantineTheme,
} from "@mantine/core";

const HEX_COLOR_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

const DEFAULT_SHADE: MantineColorShade = 6;

/** Maps filter labels to Mantine palette keys and shades (no hardcoded hex). */
const NAMED_THEME_COLORS: Record<
	string,
	{color: keyof MantineTheme["colors"]; shade: MantineColorShade}
> = {
	black: {color: "dark", shade: 9},
	blue: {color: "blue", shade: DEFAULT_SHADE},
	charcoal: {color: "dark", shade: DEFAULT_SHADE},
	cream: {color: "yellow", shade: 2},
	gray: {color: "gray", shade: DEFAULT_SHADE},
	green: {color: "green", shade: DEFAULT_SHADE},
	navy: {color: "indigo", shade: 8},
	orange: {color: "orange", shade: DEFAULT_SHADE},
	red: {color: "red", shade: DEFAULT_SHADE},
	white: {color: "gray", shade: 0},
};

/**
 * Resolves a filter color value to a hex/CSS color safe for Mantine ColorSwatch.
 * Named colors are read from `theme.colors`; returns undefined when unknown.
 */
export function resolveFilterColor(
	value: string,
	theme: MantineTheme = DEFAULT_THEME,
): string | undefined {
	const trimmed = value.trim();
	if (!trimmed) {
		return undefined;
	}

	if (HEX_COLOR_PATTERN.test(trimmed)) {
		return trimmed;
	}

	const normalized = trimmed.toLowerCase();
	const named = NAMED_THEME_COLORS[normalized];

	if (named) {
		return theme.colors[named.color][named.shade];
	}

	if (normalized in theme.colors) {
		return theme.colors[normalized as keyof MantineTheme["colors"]][
			DEFAULT_SHADE
		];
	}

	return undefined;
}
