import {z} from "zod";

/** Theme `defaultProps` for `useProps("OutputChunkLabelComponent", …)`. */
export const OutputChunkLabelComponentThemeDefaultPropsSchema = z.strictObject({
	fontWeight: z.string().optional(),
});

/**
 * @docAttached
 * @category entity
 * @configPath themeOverrides.components.OutputChunkLabelComponent.defaultProps
 * @displayName OutputChunkLabelComponent
 */
export interface OutputChunkLabelComponentThemeDefaultProps extends z.infer<
	typeof OutputChunkLabelComponentThemeDefaultPropsSchema
> {
	/** Font weight for chunk title (`fw` on label text). */
	fontWeight?: string;
}
