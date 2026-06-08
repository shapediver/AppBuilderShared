import {IconThemeDefaultPropsSchema} from "@AppBuilderLib/shared/ui/icon/Icon.types";
import {mantineBoxPropsSchema} from "@AppBuilderLib/shared/mantine-props/box.zod";
import {mantineButtonPropsSchema} from "@AppBuilderLib/shared/mantine-props/button.zod";
import {mantinePaperPropsSchema} from "@AppBuilderLib/shared/mantine-props/paper.zod";
import {mantineStackPropsSchema} from "@AppBuilderLib/shared/mantine-props/stack.zod";
import {mantineTextPropsSchema} from "@AppBuilderLib/shared/mantine-props/text.zod";
import {z} from "zod";

export const AppBuilderStackUiWidgetThemeDefaultPropsSchema = z.strictObject({
	stackPaperProps: mantinePaperPropsSchema.optional(),
	stackProps: mantineStackPropsSchema.optional(),
	contentStackProps: mantineStackPropsSchema.optional(),
	stackContentProps: mantineBoxPropsSchema.optional(),
	buttonForwardProps: mantineButtonPropsSchema.optional(),
	buttonBackProps: mantineButtonPropsSchema.optional(),
	itemTextProps: mantineTextPropsSchema.optional(),
	iconForwardProps: IconThemeDefaultPropsSchema.optional(),
	iconBackProps: IconThemeDefaultPropsSchema.optional(),
});

export type AppBuilderStackUiWidgetThemeDefaultProps = z.infer<
	typeof AppBuilderStackUiWidgetThemeDefaultPropsSchema
>;
