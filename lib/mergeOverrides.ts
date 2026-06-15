/**
 * Deep-merge `source` into `target`.
 * Objects are merged recursively. Arrays and primitives in `source` replace those in `target`.
 * If a property in `source` is `null`, it is deleted from the result rather than set to `null`.
 * Does not mutate `target`.
 */
export function deepMerge(
    target: Record<string, unknown>,
    source: Record<string, unknown>,
): Record<string, unknown> {
    const result = { ...target };
    const keys = Object.keys(source);
    for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        const sv = source[k];
        const tv = target[k];
        if (
            sv !== null &&
            typeof sv === "object" &&
            !Array.isArray(sv) &&
            tv !== null &&
            typeof tv === "object" &&
            !Array.isArray(tv)
        ) {
            result[k] = deepMerge(
                tv as Record<string, unknown>,
                sv as Record<string, unknown>,
            );
        } else if (sv === null) {
            delete result[k];
        } else {
            result[k] = sv;
        }
    }
    return result;
}

/**
 * Apply overrides to a definition object.
 *
 * Properties other than `settings` are shallow-merged.
 * The `settings` property is deep-merged so that individual properties from the override
 * are merged into the original settings rather than replacing the entire object.
 * If a property in `overrides` is `null`, it is deleted from the result rather than set to `null`.
 * If `settings` in `overrides` is `null`, the `settings` property is deleted from the result.
 *
 * @param definition The original definition object.
 * @param overrides The overrides to apply.
 * @returns A new definition object with overrides applied.
 */
export function applyOverrides<T extends { settings?: unknown }>(
    definition: T,
    overrides: Partial<T> | undefined,
): T {
    if (!overrides) return definition;

    const { settings: overriddenSettings, ...restOverrides } = overrides;

    // Filter out null values from restOverrides to allow deletion of properties
    const filteredRestOverrides = Object.fromEntries(
        Object.entries(restOverrides).filter(([_, v]) => v !== null)
    );

    const result = {
        ...definition,
        ...filteredRestOverrides,
    };

    if (overriddenSettings && definition.settings) {
        result.settings = deepMerge(
            definition.settings as Record<string, unknown>,
            overriddenSettings as Record<string, unknown>,
        );
    } else if (overriddenSettings !== null) {
        result.settings = overriddenSettings;
    } else {
        // If overriddenSettings is null, delete the settings property entirely
        delete result.settings;
    }

    return result;
}