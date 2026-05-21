import {z} from "zod";

/** Mantine `Loader` size token or CSS / number (aligned with `LoaderProps["size"]` usage in theme). */
const loaderSizeJsonSchema = z.union([
	z.literal("xs"),
	z.literal("sm"),
	z.literal("md"),
	z.literal("lg"),
	z.literal("xl"),
	z.string(),
	z.number(),
]);

/** Theme `defaultProps` for `useProps("LoaderPage", …)`. */
export const LoaderPageThemeDefaultPropsSchema = z.strictObject({
	type: z.string().optional(),
	size: loaderSizeJsonSchema.optional(),
});

/** TypeDoc surface for `useProps("LoaderPage", …)` theme defaults. */
export interface LoaderPageThemeDefaultProps
	extends z.infer<typeof LoaderPageThemeDefaultPropsSchema> {}
