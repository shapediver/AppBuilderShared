import {z} from "zod";

/**
 * Concrete App Builder templates (theme `template` + map keys).
 * Single source for literals shared with Zod theme validation.
 */
export const APP_BUILDER_TEMPLATE_THEME_IDS = ["appshell", "grid"] as const;

export type AppBuilderTemplateThemeId =
	(typeof APP_BUILDER_TEMPLATE_THEME_IDS)[number];

export const appBuilderTemplateThemeIdSchema = z.enum(
	APP_BUILDER_TEMPLATE_THEME_IDS,
);

/** Context `name` includes `unspecified` before a template is chosen. */
export const APP_BUILDER_TEMPLATE_CONTEXT_NAMES = [
	...APP_BUILDER_TEMPLATE_THEME_IDS,
	"unspecified",
] as const;

export type AppBuilderTemplateType =
	(typeof APP_BUILDER_TEMPLATE_CONTEXT_NAMES)[number];

export const appBuilderTemplateTypeSchema = z.enum(
	APP_BUILDER_TEMPLATE_CONTEXT_NAMES,
);
