/**
 * Serializable Mantine theme override keys (partial `MantineTheme`).
 * Aligns with `MantineThemeOverrideSchema` in appbuildertypecheck.
 * @see https://mantine.dev/theming/theme-object/
 */
export interface MantineThemeOverrideProps {
	focusRing?: "auto" | "always" | "never";
	scale?: number;
	fontSmoothing?: boolean;
	white?: string;
	black?: string;
	primaryColor?: string;
	autoContrast?: boolean;
	luminanceThreshold?: number;
	fontFamily?: string;
	fontFamilyMonospace?: string;
	defaultRadius?: string | number;
	cursorType?: "default" | "pointer";
	respectReducedMotion?: boolean;
	activeClassName?: string;
	focusClassName?: string;
	colors?: Record<string, string[]>;
	primaryShade?:
		| number
		| {
				light?: number;
				dark?: number;
		  };
	fontSizes?: Record<string, string>;
	lineHeights?: Record<string, string>;
	radius?: Record<string, string>;
	spacing?: Record<string, string>;
	breakpoints?: Record<string, string>;
	shadows?: Record<string, string>;
	headings?: Record<string, unknown>;
	defaultGradient?: {
		from?: string;
		to?: string;
		deg?: number;
	};
	components?: Record<string, unknown>;
	other?: Record<string, unknown>;
}
