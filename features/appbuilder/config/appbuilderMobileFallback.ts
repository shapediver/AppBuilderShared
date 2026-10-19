import {z} from "@AppBuilderLib/shared/lib/zod";
import {AppBuilderContainerNameType} from "./appbuilder";

/** Literal union used by Zod for standard container names. */
export const APP_BUILDER_STANDARD_CONTAINER_NAME_VALUES = [
	AppBuilderContainerNameType.Left,
	AppBuilderContainerNameType.Right,
	AppBuilderContainerNameType.Top,
	AppBuilderContainerNameType.Bottom,
] as const;

export const appBuilderStandardContainerNameSchema = z.enum(
	APP_BUILDER_STANDARD_CONTAINER_NAME_VALUES,
);

/** JSON + theme schema for {@link IAppBuilderStandardContainerMobileFallback}. */
export const appBuilderStandardContainerMobileFallbackSchema = z.strictObject({
	disabled: z.boolean().optional(),
	container: appBuilderStandardContainerNameSchema.optional(),
	position: z.enum(["before", "after"]).optional(),
	order: z.number().optional(),
});

/** JSON schema for {@link IAppBuilderStandardContainerProps}. */
export const appBuilderStandardContainerPropsSchema = z.strictObject({
	mobileFallback: appBuilderStandardContainerMobileFallbackSchema.optional(),
});

/** JSON + theme schema for {@link IAppBuilderViewportAnchorMobileFallback}. */
export const appBuilderViewportAnchorMobileFallbackSchema = z.strictObject({
	disabled: z.boolean().optional(),
	previewIcon: z.string().optional(),
	container: appBuilderStandardContainerNameSchema.optional(),
	position: z.enum(["before", "after"]).optional(),
	order: z.number().optional(),
});

/** Theme `mobileFallbacks` map on AppBuilderTemplateSelector. */
export const appBuilderMobileFallbacksThemeSchema = z.strictObject({
	left: appBuilderStandardContainerMobileFallbackSchema.optional(),
	right: appBuilderStandardContainerMobileFallbackSchema.optional(),
	top: appBuilderStandardContainerMobileFallbackSchema.optional(),
	bottom: appBuilderStandardContainerMobileFallbackSchema.optional(),
});

/**
 * Default threshold for standard-container and viewport-anchor mobile
 * fallbacks (`AppBuilderTemplateSelector.mobileBreakpoint`). AppShell
 * `navbarBreakpoint` uses the same default so the burger matches unless
 * overridden.
 */
export const APP_BUILDER_MOBILE_BREAKPOINT_DEFAULT = "md" as const;
