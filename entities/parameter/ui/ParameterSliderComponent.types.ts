import {z} from "zod";

const widthJsonSchema = z.union([z.string(), z.number()]).optional();

/** Theme `defaultProps` for `useProps("ParameterSliderComponent", …)` (width fields only). */
export const ParameterSliderComponentThemeDefaultPropsSchema = z.strictObject({
	sliderWidth: widthJsonSchema,
	numberWidth: widthJsonSchema,
});

/** TypeDoc surface for `useProps("ParameterSliderComponent", …)` theme defaults. */
export interface ParameterSliderComponentThemeDefaultProps
	extends z.infer<typeof ParameterSliderComponentThemeDefaultPropsSchema> {}
