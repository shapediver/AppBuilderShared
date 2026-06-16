import {viewportBrandingSettingsSchema} from "@AppBuilderLib/entities/viewport/config/ViewportBranding.theme.types";
import {z} from "zod";

/** Theme `defaultProps` for `useProps("ViewportComponent", …)`. */
export const ViewportComponentThemeDefaultPropsSchema = z.strictObject({
	className: z.string().optional(),
	showStatistics: z.boolean().optional(),
	branding: viewportBrandingSettingsSchema.optional(),
	sessionSettingsId: z.string().optional(),
	sessionSettingsMode: z.string().optional(),
	visibility: z.string().optional(),
	visibilitySessionIds: z.array(z.string()).optional(),
	flags: z.record(z.string(), z.string()).optional(),
	initialAutoAdjust: z.boolean().optional(),
});

export type ViewportComponentThemeDefaultProps = z.infer<
	typeof ViewportComponentThemeDefaultPropsSchema
>;
