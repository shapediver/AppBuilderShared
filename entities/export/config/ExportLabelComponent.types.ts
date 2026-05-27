import {z} from "zod";

/** Theme `defaultProps` for `useProps("ExportLabelComponent", …)`. */
export const ExportLabelComponentThemeDefaultPropsSchema = z.strictObject({
	fontWeight: z.string().optional(),
});

/** TypeDoc surface for theme `defaultProps` inferred from the Zod schema above. */
export interface ExportLabelComponentThemeDefaultProps
	extends z.infer<typeof ExportLabelComponentThemeDefaultPropsSchema> {}
