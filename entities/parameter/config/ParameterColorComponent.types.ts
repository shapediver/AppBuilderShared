import type {ColorFormatType} from "@AppBuilderLib/shared/lib/colors";
import {z} from "zod";

/** Theme `defaultProps` for `useProps("ParameterColorComponent", …)` (color format only). */
export const ParameterColorComponentThemeDefaultPropsSchema = z.strictObject({
	colorFormat: z.enum(["hexa", "rgba"]).optional(),
});

/**
 * @docAttached
 * @category entity
 * @configPath themeOverrides.components.ParameterColorComponent.defaultProps
 * @displayName ParameterColorComponent
 */
export interface ParameterColorComponentThemeDefaultProps
	extends z.infer<typeof ParameterColorComponentThemeDefaultPropsSchema> {
	/**
	 * Color format for ShapeDiver ↔ Mantine conversion.
	 * @default "rgba"
	 */
	colorFormat?: ColorFormatType;
}
