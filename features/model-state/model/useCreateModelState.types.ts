import {z} from "zod";

/** Theme `defaultProps` for `useProps("CreateModelStateHook", …)`. */
export const CreateModelStateHookThemeDefaultPropsSchema = z.strictObject({
	parameterNamesToInclude: z.array(z.string()).optional(),
	parameterNamesToExclude: z.array(z.string()).optional(),
	parameterNamesToAlwaysExclude: z.array(z.string()).optional(),
});

/**
 * Theme defaults for {@link useCreateModelState} parameter filtering.
 *
 * @docAttached
 * @category feature
 * @configPath themeOverrides.components.CreateModelStateHook.defaultProps
 * @displayName CreateModelStateHook
 */
export interface CreateModelStateHookThemeDefaultProps
	extends z.infer<typeof CreateModelStateHookThemeDefaultPropsSchema> {
	/**
	 * Default allow-list of parameter `name` or `displayname` values saved to a model state.
	 * When omitted, all parameters pass the include filter (subject to exclude rules).
	 */
	parameterNamesToInclude?: string[];
	/**
	 * Default deny-list of parameter `name` or `displayname` values omitted from a model state.
	 * When omitted, no parameters are excluded by this filter.
	 */
	parameterNamesToExclude?: string[];
	/**
	 * Parameter `name` or `displayname` values always omitted from a model state,
	 * regardless of include/exclude lists.
	 * @default []
	 */
	parameterNamesToAlwaysExclude?: string[];
}
