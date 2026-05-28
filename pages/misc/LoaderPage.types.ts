import {mantineSpacingSchema} from "@AppBuilderLib/shared/mantine-props/spacing";
import {z} from "zod";

/** Theme `defaultProps` for `useProps("LoaderPage", …)`. */
export const LoaderPageThemeDefaultPropsSchema = z.strictObject({
	type: z.string().optional(),
	size: mantineSpacingSchema.optional(),
});

/** TypeDoc surface for `useProps("LoaderPage", …)` theme defaults. */
export interface LoaderPageThemeDefaultProps
	extends z.infer<typeof LoaderPageThemeDefaultPropsSchema> {}
