import {z} from "zod";

/** Theme `defaultProps` for `useProps("AppBuilderGridTemplatePage", …)`. */
export const AppBuilderGridTemplatePageThemeDefaultPropsSchema = z.strictObject(
	{
		bgTop: z.string().optional(),
		bgLeft: z.string().optional(),
		bgRight: z.string().optional(),
		bgBottom: z.string().optional(),
		columns: z.number().optional(),
		rows: z.number().optional(),
		leftColumns: z.number().optional(),
		rightColumns: z.number().optional(),
		topRows: z.number().optional(),
		bottomRows: z.number().optional(),
		topFullWidth: z.boolean().optional(),
		bottomFullWidth: z.boolean().optional(),
	},
);

export type AppBuilderGridTemplatePageThemeDefaultProps = z.infer<
	typeof AppBuilderGridTemplatePageThemeDefaultPropsSchema
>;
