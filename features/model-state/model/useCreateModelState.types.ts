import {z} from "zod";

/** Theme `defaultProps` for `useProps("CreateModelStateHook", …)`. */
export const CreateModelStateHookThemeDefaultPropsSchema = z.strictObject({
	parameterNamesToInclude: z.array(z.string()).optional(),
	parameterNamesToExclude: z.array(z.string()).optional(),
	parameterNamesToAlwaysExclude: z.array(z.string()).optional(),
});

/** TypeDoc surface for `useProps("CreateModelStateHook", …)` theme defaults. */
export interface CreateModelStateHookThemeDefaultProps
	extends z.infer<typeof CreateModelStateHookThemeDefaultPropsSchema> {}
