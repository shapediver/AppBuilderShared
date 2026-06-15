import {mantineCardPropsSchema} from "@AppBuilderLib/shared/mantine-props/card.zod";
import {mantineGroupPropsSchema} from "@AppBuilderLib/shared/mantine-props/group.zod";
import {mantineImagePropsSchema} from "@AppBuilderLib/shared/mantine-props/image.zod";
import {mantineStackPropsSchema} from "@AppBuilderLib/shared/mantine-props/stack.zod";
import {mantineTextPropsSchema} from "@AppBuilderLib/shared/mantine-props/text.zod";
import {z} from "zod";

/** Theme `defaultProps` for `useProps("SelectFullWidthCardsComponent", …)`. */
export const SelectFullWidthCardsComponentThemeDefaultPropsSchema =
	z.strictObject({
		cardProps: mantineCardPropsSchema.optional(),
		groupProps: mantineGroupPropsSchema.optional(),
		imageProps: mantineImagePropsSchema.optional(),
		stackProps: mantineStackPropsSchema.optional(),
		labelProps: mantineTextPropsSchema.optional(),
		descriptionProps: mantineTextPropsSchema.optional(),
		searchable: z.boolean().optional(),
		limit: z.number().int().positive().optional(),
		height: z.string().optional(),
		useLocalSearch: z.boolean().optional(),
	});

export type SelectFullWidthCardsComponentThemeDefaultProps = z.infer<
	typeof SelectFullWidthCardsComponentThemeDefaultPropsSchema
>;
