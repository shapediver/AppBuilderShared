import {selectSimpleGridPropsSchema} from "@AppBuilderLib/entities/parameter/config/selectComponent.theme.types";
import {mantineCardPropsSchema} from "@AppBuilderLib/shared/mantine-props/card.zod";
import {mantineImagePropsSchema} from "@AppBuilderLib/shared/mantine-props/image.zod";
import {mantineStackPropsSchema} from "@AppBuilderLib/shared/mantine-props/stack.zod";
import {mantineTextPropsSchema} from "@AppBuilderLib/shared/mantine-props/text.zod";
import {z} from "zod";

/** Theme `defaultProps` for `useProps("SelectGridComponent", …)`. */
export const SelectGridComponentThemeDefaultPropsSchema = z.strictObject({
	gridProps: selectSimpleGridPropsSchema.optional(),
	cardProps: mantineCardPropsSchema.optional(),
	imageProps: mantineImagePropsSchema.optional(),
	stackProps: mantineStackPropsSchema.optional(),
	labelProps: mantineTextPropsSchema.optional(),
	descriptionProps: mantineTextPropsSchema.optional(),
	showLabel: z.boolean().optional(),
	searchable: z.boolean().optional(),
	limit: z.number().int().positive().optional(),
	height: z.string().optional(),
});

export type SelectGridComponentThemeDefaultProps = z.infer<
	typeof SelectGridComponentThemeDefaultPropsSchema
>;
