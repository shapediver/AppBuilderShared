import {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineTextPropsSchema} from "@AppBuilderLib/shared/mantine-props/text.zod";

/** Theme `defaultProps` for `useProps("AppBuilderToolbarMenuItemButton", …)`. */
export const AppBuilderToolbarMenuItemButtonThemeDefaultPropsSchema =
	z.strictObject({
		itemProps: z.looseObject({}).optional(),
		labelProps: mantineTextPropsSchema.optional(),
		iconProps: z.looseObject({}).optional(),
	});

export type AppBuilderToolbarMenuItemButtonThemeDefaultProps = z.infer<
	typeof AppBuilderToolbarMenuItemButtonThemeDefaultPropsSchema
>;
