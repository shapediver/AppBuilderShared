import {selectComponentOverridesSchema} from "@AppBuilderLib/entities/parameter/config/selectComponent.theme.types";
import {ParameterStringInputMode} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {z} from "@AppBuilderLib/shared/lib/zod";

export {ParameterStringInputMode};

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
