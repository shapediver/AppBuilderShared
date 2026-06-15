/**
 * Deep-merge `source` into `target`.
 * Objects are merged recursively. Arrays and primitives in `source` replace those in `target`.
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

    const result = {
        ...definition,
        ...restOverrides,
    };

    if (overriddenSettings && definition.settings) {
        result.settings = deepMerge(
            definition.settings as Record<string, unknown>,
            overriddenSettings as Record<string, unknown>,
        );
    } else if (overriddenSettings) {
        result.settings = overriddenSettings;
    }

    return result;
}