import {z} from "@AppBuilderLib/shared/lib/zod";

/**
 * Theme `defaultProps` for `useProps("AgentUi")`.
 * History chrome and load behavior are independent. Both default on.
 */
export const AgentUiThemeDefaultPropsSchema = z.strictObject({
	mode: z.enum(["iframe", "window"]).optional(),
	showThreadHistory: z.boolean().optional(),
	createThreadOnLoad: z.boolean().optional(),
});

export type AgentUiThemeDefaultProps = z.infer<
	typeof AgentUiThemeDefaultPropsSchema
>;
