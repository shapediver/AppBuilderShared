import {mantineMenuPropsSchema} from "@AppBuilderLib/shared/mantine-props/menu.zod";
import {mantineMenuDropdownPropsSchema} from "@AppBuilderLib/shared/mantine-props/menuDropdown.zod";
import {z} from "zod";

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
