import {mantineButtonPropsSchema} from "@AppBuilderLib/shared/mantine-props/button.zod";
import {mantineLoaderPropsSchema} from "@AppBuilderLib/shared/mantine-props/loader.zod";
import {mantineTextPropsSchema} from "@AppBuilderLib/shared/mantine-props/text.zod";
import {z} from "zod";

/** Theme `defaultProps` for `useProps("StargateInput", …)`. */
export const StargateInputThemeDefaultPropsSchema = z.strictObject({
	buttonProps: mantineButtonPropsSchema.optional(),
	loadingButtonProps: mantineButtonPropsSchema.optional(),
	textProps: mantineTextPropsSchema.optional(),
	loaderProps: mantineLoaderPropsSchema.optional(),
});

export type StargateInputThemeDefaultProps = z.infer<
	typeof StargateInputThemeDefaultPropsSchema
>;
