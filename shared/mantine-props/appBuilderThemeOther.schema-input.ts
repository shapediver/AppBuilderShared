/**
 * App Builder `theme.other` keys (product defaults + global behavior flags).
 * Serializable via settings JSON: `themeOverrides.other`.
 * @strict
 */
export interface AppBuilderThemeOtherProps {
	/**
	 * When `true`, merges Mantine's `v8CssVariablesResolver` with AppBuilder CSS
	 * variables (v8 `light` variant colors). Default in product theme: `false`.
	 */
	v8ThemeSupport?: boolean;
	/** Force light or dark color scheme on `MantineProvider`. */
	forceColorScheme?: "light" | "dark";
	/** Single favicon URL when `iconDarkUrl` / `iconLightUrl` are not both set. */
	iconUrl?: string;
	/** Dark-scheme favicon; pair with `iconLightUrl`. */
	iconDarkUrl?: string;
	/** Light-scheme favicon; pair with `iconDarkUrl`. */
	iconLightUrl?: string;
	defaultFontWeightThin?: string;
	defaultFontWeightLight?: string;
	defaultFontWeight?: string;
	defaultFontWeightMedium?: string;
	defaultFontWeightBold?: string;
}
