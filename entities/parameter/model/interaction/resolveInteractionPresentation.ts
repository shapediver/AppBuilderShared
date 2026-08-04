/**
 * Resolve the effective presentation mode for an interaction parameter.
 *
 * Explicit `presentation` wins. When omitted, `alwaysActive` interactions
 * default to `"toolbar"` while all others default to `"widget"`.
 */
export const resolveInteractionPresentation = (
	presentation: "widget" | "toolbar" | undefined,
	alwaysActive: boolean,
): "widget" | "toolbar" => presentation ?? (alwaysActive ? "toolbar" : "widget");
