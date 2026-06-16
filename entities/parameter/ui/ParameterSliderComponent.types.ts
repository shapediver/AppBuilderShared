import {z} from "zod";

const widthJsonSchema = z.union([z.string(), z.number()]).optional();

/** Theme `defaultProps` for `useProps("ParameterSliderComponent", …)` (width fields only). */
export const ParameterSliderComponentThemeDefaultPropsSchema = z.strictObject({
	sliderWidth: widthJsonSchema,
	numberWidth: widthJsonSchema,
});

/**
 * @docAttached
 * @category entity
 * @configPath themeOverrides.components.ParameterSliderComponent.defaultProps
 * @displayName ParameterSliderComponent
 */
export interface ParameterSliderComponentThemeDefaultProps
	extends z.infer<typeof ParameterSliderComponentThemeDefaultPropsSchema> {
	/**
	 * Width of the slider track (`w` on Mantine `Slider`).
	 * @default "60%"
	 */
	sliderWidth?: string | number;
	/**
	 * Width of the numeric input beside the slider (`w` on Mantine `NumberInput`).
	 * @default "35%"
	 */
	numberWidth?: string | number;
}
