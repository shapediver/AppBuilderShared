import {mantineActionIconPropsSchema} from "@AppBuilderLib/shared/mantine-props/actionIcon.zod";
import {mantineButtonPropsSchema} from "@AppBuilderLib/shared/mantine-props/button.zod";
import {mantinePaperPropsSchema} from "@AppBuilderLib/shared/mantine-props/paper.zod";
import {mantineStackPropsSchema} from "@AppBuilderLib/shared/mantine-props/stack.zod";
import {z} from "zod";

export const AppBuilderFormWidgetComponentThemeDefaultPropsSchema =
	z.strictObject({
		stackProps: mantineStackPropsSchema.optional(),
		formPaperProps: mantinePaperPropsSchema.optional(),
		elementPaperProps: mantinePaperPropsSchema.optional(),
		exportPaperProps: mantinePaperPropsSchema.optional(),
		submitButtonPaperProps: mantinePaperPropsSchema.optional(),
		messagePaperProps: mantinePaperPropsSchema.optional(),
		submitButtonProps: mantineButtonPropsSchema.optional(),
		resetButtonProps: mantineActionIconPropsSchema.optional(),
		resetMessage: z.string().optional(),
	});

export type AppBuilderFormWidgetComponentThemeDefaultProps = z.infer<
	typeof AppBuilderFormWidgetComponentThemeDefaultPropsSchema
>;
