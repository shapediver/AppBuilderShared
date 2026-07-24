import {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineButtonPropsSchema} from "@AppBuilderLib/shared/mantine-props/button.zod";
import {mantineFlexPropsSchema} from "@AppBuilderLib/shared/mantine-props/flex.zod";

const selectButtonFlexButtonPropsSchema = mantineButtonPropsSchema.omit({
	disabled: true,
	variant: true,
});

/** Theme `defaultProps` for `useProps("SelectButtonFlexComponent", …)`. */
export const SelectButtonFlexComponentThemeDefaultPropsSchema = z.strictObject({
	flexProps: mantineFlexPropsSchema.optional(),
	buttonProps: selectButtonFlexButtonPropsSchema.optional(),
});

export type SelectButtonFlexComponentThemeDefaultProps = z.infer<
	typeof SelectButtonFlexComponentThemeDefaultPropsSchema
>;
