import {z} from "@AppBuilderLib/shared/lib/zod";

/**
 * Theme `defaultProps` for `useProps("AgentUi")`.
 * History chrome and load behavior are independent. History defaults on.
 * `createThreadOnLoad` stays optional so the host can derive it from `mode`.
 */
export const AgentUiThemeDefaultPropsSchema = z.strictObject({
	mode: z.enum(["iframe", "window"]).optional(),
	showThreadHistory: z.boolean().optional(),
	createThreadOnLoad: z.boolean().optional(),
});

export type AgentUiThemeDefaultProps = z.infer<
	typeof AgentUiThemeDefaultPropsSchema
>;
