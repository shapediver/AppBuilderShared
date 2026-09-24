/**
 * Overlay `patch` onto `base`, keeping `base` values for keys that are
 * omitted or `undefined` in `patch`. A missing `patch` leaves `base` as-is.
 */
export function overlayDefinedFields<T extends object>(
	base: T | undefined,
	patch: T | undefined,
): T | undefined {
	if (patch == null) {
		return base;
	}
	if (base == null) {
		return patch;
	}
	const defined = Object.fromEntries(
		Object.entries(patch).filter(([, value]) => value !== undefined),
	) as Partial<T>;
	return {...base, ...defined};
}
