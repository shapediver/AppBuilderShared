import {AppBuilderToolbarIconButtonThemeDefaultPropsSchema} from "@AppBuilderLib/features/appbuilder/config/AppBuilderToolbarIconButton.theme.types";
import {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineDividerPropsSchema} from "@AppBuilderLib/shared/mantine-props/divider.zod";
import {mantineMenuDropdownPropsSchema} from "@AppBuilderLib/shared/mantine-props/menuDropdown.zod";
import {mantineStackPropsSchema} from "@AppBuilderLib/shared/mantine-props/stack.zod";

/** Theme `defaultProps` for `useProps("AppBuilderToolbarButton", …)`.
 * Extends `AppBuilderToolbarIconButton` so toolbar triggers share the same
 * base icon-button styling definitions.
 */
export const AppBuilderToolbarButtonThemeDefaultPropsSchema =
	AppBuilderToolbarIconButtonThemeDefaultPropsSchema.extend({
		popoverProps: z.looseObject({}).optional(),
		popoverDropdownProps: mantineMenuDropdownPropsSchema.optional(),
		menuStackProps: mantineStackPropsSchema.optional(),
		menuSectionStackProps: mantineStackPropsSchema.optional(),
		menuDividerProps: mantineDividerPropsSchema.optional(),
	});

export type AppBuilderToolbarButtonThemeDefaultProps = z.infer<
	typeof AppBuilderToolbarButtonThemeDefaultPropsSchema
>;
