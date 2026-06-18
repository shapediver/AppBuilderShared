import {mantinePaperPropsSchema} from "@AppBuilderLib/shared/mantine-props/paper.zod";
import {mantineStackPropsSchema} from "@AppBuilderLib/shared/mantine-props/stack.zod";
import {z} from "zod";

export const AppBuilderControlsWidgetComponentThemeDefaultPropsSchema =
	z.strictObject({
		stackProps: mantineStackPropsSchema.optional(),
		elementPaperProps: mantinePaperPropsSchema.optional(),
		outputPaperProps: mantinePaperPropsSchema.optional(),
	});

export type AppBuilderControlsWidgetComponentThemeDefaultProps = z.infer<
	typeof AppBuilderControlsWidgetComponentThemeDefaultPropsSchema
>;
