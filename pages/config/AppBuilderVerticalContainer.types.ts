import {z} from "zod";

/** JSON-safe Mantine spacing token (theme + numeric/string fallbacks). */
const mantineSpacingJsonSchema = z.union([
	z.literal("xs"),
	z.literal("sm"),
	z.literal("md"),
	z.literal("lg"),
	z.literal("xl"),
	z.string(),
	z.number(),
]);

/** Theme `defaultProps` for `useProps("AppBuilderVerticalContainer", …)`. */
export const AppBuilderVerticalContainerThemeDefaultPropsSchema = z.strictObject({
	p: mantineSpacingJsonSchema.optional(),
});

/** TypeDoc surface for `useProps("AppBuilderVerticalContainer", …)` theme defaults. */
export interface AppBuilderVerticalContainerThemeDefaultProps
	extends z.infer<typeof AppBuilderVerticalContainerThemeDefaultPropsSchema> {}
