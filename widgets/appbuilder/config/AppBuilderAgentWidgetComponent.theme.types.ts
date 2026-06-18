import {mantinePaperPropsSchema} from "@AppBuilderLib/shared/mantine-props/paper.zod";
import {z} from "zod";

/** Agent configuration keys from `AppBuilderAgentWidgetComponentConfigProps`. */
const AppBuilderAgentWidgetComponentConfigPropsSchema = z.strictObject({
	systemPrompt: z.string().optional(),
	parameterNamesToInclude: z.array(z.string()).optional(),
	parameterNamesToExclude: z.array(z.string()).optional(),
	authorContext: z.string().optional(),
	debug: z.boolean().optional(),
	maxHistory: z.number().optional(),
	model: z.string().optional(),
	openaiApiKey: z.string().optional(),
	langfuseSecretKey: z.string().optional(),
	langfusePublicKey: z.string().optional(),
	langfuseBaseUrl: z.string().optional(),
});

/** Theme `defaultProps` for `useProps("AppBuilderAgentWidgetComponent", …)`. */
export const AppBuilderAgentWidgetComponentThemeDefaultPropsSchema =
	mantinePaperPropsSchema.merge(
		AppBuilderAgentWidgetComponentConfigPropsSchema,
	);

export type AppBuilderAgentWidgetComponentThemeDefaultProps = z.infer<
	typeof AppBuilderAgentWidgetComponentThemeDefaultPropsSchema
>;
