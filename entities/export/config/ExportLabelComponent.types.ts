import {z} from "zod";

/** Theme `defaultProps` for `useProps("ExportLabelComponent", …)`. */
export const ExportLabelComponentThemeDefaultPropsSchema = z.strictObject({
	fontWeight: z.string().optional(),
});

/**
 * @docAttached
 * @category entity
 * @configPath themeOverrides.components.ExportLabelComponent.defaultProps
 * @displayName ExportLabelComponent
 */
export interface ExportLabelComponentThemeDefaultProps
	extends z.infer<typeof ExportLabelComponentThemeDefaultPropsSchema> {
	/** Font weight for the export title text (Mantine `fw` prop). */
	fontWeight?: string;
}
