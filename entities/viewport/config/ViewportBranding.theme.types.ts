import {z} from "zod";

/** Single-scheme viewport branding settings (logo, spinner, busy mode). */
export const viewportBrandingSettingsSchema = z.strictObject({
	logo: z.union([z.string(), z.null()]).optional(),
	backgroundColor: z.string().optional(),
	busyModeSpinner: z.string().optional(),
	busyModeDisplay: z.string().optional(),
	spinnerPositioning: z.string().optional(),
});

/** Theme `defaultProps` for `useProps("ViewportBranding", …)`. */
export const ViewportBrandingThemeDefaultPropsSchema = z.strictObject({
	dark: viewportBrandingSettingsSchema.optional(),
	light: viewportBrandingSettingsSchema.optional(),
});

export type ViewportBrandingThemeDefaultProps = z.infer<
	typeof ViewportBrandingThemeDefaultPropsSchema
>;
