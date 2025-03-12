import {useMantineTheme} from "@mantine/core";

type FontWeight = "thin" | "light" | "normal" | "medium" | "bold";

/**
 * Hook for deciding whether the device is a mobile (layout changes).
 * @returns
 */
export function useDefaultFontWeight(
	value: string | undefined,
	weight: FontWeight,
): string {
	const theme = useMantineTheme();
	if (value !== undefined) {
		return value;
	}
	switch (weight) {
		case "thin":
			return theme.other.defaultFontWeightThin;
		case "light":
			return theme.other.defaultFontWeightLight;
		case "normal":
			return theme.other.defaultFontWeight;
		case "medium":
			return theme.other.defaultFontWeightMedium;
		case "bold":
			return theme.other.defaultFontWeightBold;
	}
}
