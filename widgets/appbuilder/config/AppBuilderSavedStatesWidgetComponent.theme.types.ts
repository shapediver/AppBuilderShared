import {mantinePaperPropsSchema} from "@AppBuilderLib/shared/mantine-props/paper.zod";
import {mantineStackPropsSchema} from "@AppBuilderLib/shared/mantine-props/stack.zod";
import {z} from "zod";

/** selectProps / loaderFlexProps / loaderProps deferred until clean JSON schemas exist. */
export const AppBuilderSavedStatesWidgetComponentThemeDefaultPropsSchema =
	z.strictObject({
		paperProps: mantinePaperPropsSchema.optional(),
		stackProps: mantineStackPropsSchema.optional(),
	});

export type AppBuilderSavedStatesWidgetComponentThemeDefaultProps = z.infer<
	typeof AppBuilderSavedStatesWidgetComponentThemeDefaultPropsSchema
>;
