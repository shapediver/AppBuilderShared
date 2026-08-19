import {selectComponentOverridesSchema} from "@AppBuilderLib/entities/parameter/config/selectComponent.theme.types";
import {z} from "@AppBuilderLib/shared/lib/zod";

/** How a string text input commits values to the session. */
export enum ParameterStringInputMode {
	Debounce = "debounce",
	Validate = "validate",
}

/** Theme `defaultProps` for `useProps("ParameterStringComponent", …)`. */
export const ParameterStringComponentThemeDefaultPropsSchema = z.strictObject({
	debounce: z.int().nonnegative().optional(),
	mode: z.enum(ParameterStringInputMode).optional(),
	componentSettings: z
		.record(
			z.string(),
			selectComponentOverridesSchema.safeExtend({
				items: z.array(z.string()).optional(),
			}),
		)
		.optional(),
});
