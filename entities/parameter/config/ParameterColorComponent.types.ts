import {z} from "zod";

/** Theme `defaultProps` for `useProps("ParameterColorComponent", …)` (color format only). */
export const ParameterColorComponentThemeDefaultPropsSchema = z.strictObject({
	colorFormat: z.enum(["hexa", "rgba"]).optional(),
});

/** TypeDoc surface for `useProps("ParameterColorComponent", …)` theme defaults. */
export interface ParameterColorComponentThemeDefaultProps
	extends z.infer<typeof ParameterColorComponentThemeDefaultPropsSchema> {}
