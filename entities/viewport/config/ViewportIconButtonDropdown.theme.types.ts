import {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineMenuPropsSchema} from "@AppBuilderLib/shared/mantine-props/menu.zod";
import {mantineMenuDropdownPropsSchema} from "@AppBuilderLib/shared/mantine-props/menuDropdown.zod";

/** Theme `defaultProps` for `useProps("ViewportIconButtonDropdowns", …)`. */
export const ViewportIconButtonDropdownThemeDefaultPropsSchema = z.strictObject(
	{
		menuProps: mantineMenuPropsSchema.optional(),
		menuDropdownProps: mantineMenuDropdownPropsSchema.optional(),
	},
);

export type ViewportIconButtonDropdownThemeDefaultProps = z.infer<
	typeof ViewportIconButtonDropdownThemeDefaultPropsSchema
>;
