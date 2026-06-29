/**
 * Serializable Mantine theme override keys (partial `MantineTheme`).
 * Doc mirror / nested component prop shape (`MantineThemeOverrideProps`); looser than settings validation.
 * Canonical strict settings schema: `MantineThemeFullSchema` / `MantineThemeOverrideSchema` in
 * `features/appbuilder/config/appbuildertypecheck.ts` (top-level `themeOverrides` in settings JSON).
 * @see https://mantine.dev/theming/theme-object/
 */
import type {AppBuilderThemeOtherProps} from "./appBuilderThemeOther.schema-input";

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
	fontWeights?: Record<string, string>;
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
	other?: AppBuilderThemeOtherProps;
}
