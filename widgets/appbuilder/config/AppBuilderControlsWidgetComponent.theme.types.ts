import {z} from "@AppBuilderLib/shared/lib/zod";
import {mantinePaperPropsSchema} from "@AppBuilderLib/shared/mantine-props/paper.zod";
import {mantineStackPropsSchema} from "@AppBuilderLib/shared/mantine-props/stack.zod";

export const AppBuilderControlsWidgetComponentThemeDefaultPropsSchema =
	z.strictObject({
		stackProps: mantineStackPropsSchema.optional(),
		elementPaperProps: mantinePaperPropsSchema.optional(),
		outputPaperProps: mantinePaperPropsSchema.optional(),
	});

export type AppBuilderControlsWidgetComponentThemeDefaultProps = z.infer<
	typeof AppBuilderControlsWidgetComponentThemeDefaultPropsSchema
>;
