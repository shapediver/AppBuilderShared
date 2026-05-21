import {z} from "zod";

/** Theme `defaultProps` for `useProps("OutputChunkLabelComponent", …)`. */
export const OutputChunkLabelComponentThemeDefaultPropsSchema = z.strictObject({
	fontWeight: z.string().optional(),
});

/** TypeDoc surface for theme `defaultProps` inferred from the Zod schema above. */
export interface OutputChunkLabelComponentThemeDefaultProps
	extends z.infer<typeof OutputChunkLabelComponentThemeDefaultPropsSchema> {}
