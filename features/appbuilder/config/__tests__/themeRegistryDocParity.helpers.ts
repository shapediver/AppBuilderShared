import {
	themeComponentDefaultPropsRegistry,
	type ThemeComponentDefaultPropsRegistryKey,
} from "../themeComponentDefaultPropsRegistry";

export type {ThemeComponentDefaultPropsRegistryKey};

/** Sorted registry keys for theme `defaultProps` Zod validation. */
export const THEME_COMPONENT_DEFAULT_PROPS_REGISTRY_KEYS: readonly ThemeComponentDefaultPropsRegistryKey[] =
	Object.freeze(
		Object.keys(
			themeComponentDefaultPropsRegistry,
		) as ThemeComponentDefaultPropsRegistryKey[],
	);

const registryKeySet = new Set<string>(THEME_COMPONENT_DEFAULT_PROPS_REGISTRY_KEYS);

export function isRegisteredThemeComponentKey(name: string): boolean {
	return registryKeySet.has(name);
}

export const THEME_DEFAULT_PROPS_CONFIG_PATH_PREFIX =
	"themeOverrides.components." as const;
export const THEME_DEFAULT_PROPS_CONFIG_PATH_SUFFIX = ".defaultProps" as const;

export function parseThemeComponentNameFromConfigPath(
	configPath: string,
): string | null {
	if (
		!configPath.startsWith(THEME_DEFAULT_PROPS_CONFIG_PATH_PREFIX) ||
		!configPath.endsWith(THEME_DEFAULT_PROPS_CONFIG_PATH_SUFFIX)
	) {
		return null;
	}
	return configPath.slice(
		THEME_DEFAULT_PROPS_CONFIG_PATH_PREFIX.length,
		configPath.length - THEME_DEFAULT_PROPS_CONFIG_PATH_SUFFIX.length,
	);
}
