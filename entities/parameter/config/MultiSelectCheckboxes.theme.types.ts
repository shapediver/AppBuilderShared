import {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineCheckboxPropsSchema} from "@AppBuilderLib/shared/mantine-props/checkbox.zod";
import {mantineStackPropsSchema} from "@AppBuilderLib/shared/mantine-props/stack.zod";

/** Theme `defaultProps` for `useProps("MultiSelectCheckboxes", …)`. */
export const MultiSelectCheckboxesThemeDefaultPropsSchema = z.strictObject({
	stackProps: mantineStackPropsSchema.optional(),
	checkboxProps: mantineCheckboxPropsSchema.optional(),
	checkboxPropsSelectAll: mantineCheckboxPropsSchema.optional(),
	labelSelectAll: z.string().optional(),
	height: z.string().optional(),
});

export type MultiSelectCheckboxesThemeDefaultProps = z.infer<
	typeof MultiSelectCheckboxesThemeDefaultPropsSchema
>;
