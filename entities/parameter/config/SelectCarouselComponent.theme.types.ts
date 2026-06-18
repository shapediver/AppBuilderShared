import {selectCarouselStylePropsSchema} from "@AppBuilderLib/entities/parameter/config/selectComponent.theme.types";
import {mantineCardPropsSchema} from "@AppBuilderLib/shared/mantine-props/card.zod";
import {mantineImagePropsSchema} from "@AppBuilderLib/shared/mantine-props/image.zod";
import {mantineStackPropsSchema} from "@AppBuilderLib/shared/mantine-props/stack.zod";
import {mantineTextPropsSchema} from "@AppBuilderLib/shared/mantine-props/text.zod";
import {z} from "zod";

/** Theme `defaultProps` for `useProps("SelectCarouselComponent", …)`. */
export const SelectCarouselComponentThemeDefaultPropsSchema = z.strictObject({
	carouselProps: selectCarouselStylePropsSchema.optional(),
	cardProps: mantineCardPropsSchema.optional(),
	imageProps: mantineImagePropsSchema.optional(),
	stackProps: mantineStackPropsSchema.optional(),
	labelProps: mantineTextPropsSchema.optional(),
	descriptionProps: mantineTextPropsSchema.optional(),
	showLabel: z.boolean().optional(),
});

export type SelectCarouselComponentThemeDefaultProps = z.infer<
	typeof SelectCarouselComponentThemeDefaultPropsSchema
>;
