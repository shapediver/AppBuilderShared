import {mantineBoxPropsSchema} from "@AppBuilderLib/shared/mantine-props/box.zod";
import {mantineStylesApiSchema} from "@AppBuilderLib/shared/mantine-props/primitives.zod";
import {mantineSizeTokenSchema} from "@AppBuilderLib/shared/mantine-props/spacing.zod";
import {z} from "zod";

const mantineTablePropsSchema = z.strictObject({
	styles: mantineStylesApiSchema.optional(),
});

const mantineTextInputPropsSchema = z.strictObject({
	size: mantineSizeTokenSchema.optional(),
});

export const AppBuilderTableWidgetComponentThemeDefaultPropsSchema =
	z.strictObject({
		tableProps: mantineTablePropsSchema.optional(),
		searchTextInputProps: mantineTextInputPropsSchema.optional(),
		searchBarProps: mantineBoxPropsSchema.optional(),
	});

export type AppBuilderTableWidgetComponentThemeDefaultProps = z.infer<
	typeof AppBuilderTableWidgetComponentThemeDefaultPropsSchema
>;
