import {z} from "zod";

/** JSON theme validation for `AppBuilderHorizontalContainer` (`Group`). `justify` stays JSON-wide (`z.string`); `wrap` matches Mantine `FlexWrap`. */
const mantineSpacingJsonSchema = z.union([
	z.literal("xs"),
	z.literal("sm"),
	z.literal("md"),
	z.literal("lg"),
	z.literal("xl"),
	z.string(),
	z.number(),
]);

const cssWidthHeightJsonSchema = z.union([z.string(), z.number()]);

/** `Group` `wrap` — align Zod with Mantine `FlexWrap` so merged theme props type-check on spread. */
const groupFlexWrapJsonSchema = z.enum(["nowrap", "wrap", "wrap-reverse"]);

/** Theme `defaultProps` for `useProps("AppBuilderHorizontalContainer", …)`. */
export const AppBuilderHorizontalContainerThemeDefaultPropsSchema = z.strictObject({
	w: cssWidthHeightJsonSchema.optional(),
	h: cssWidthHeightJsonSchema.optional(),
	justify: z.string().optional(),
	wrap: groupFlexWrapJsonSchema.optional(),
	p: mantineSpacingJsonSchema.optional(),
});

/** TypeDoc surface for `useProps("AppBuilderHorizontalContainer", …)` theme defaults. */
export interface AppBuilderHorizontalContainerThemeDefaultProps
	extends z.infer<typeof AppBuilderHorizontalContainerThemeDefaultPropsSchema> {}
