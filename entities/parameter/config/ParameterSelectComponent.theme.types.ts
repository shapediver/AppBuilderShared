import {selectComponentOverridesSchema} from "@AppBuilderLib/entities/parameter/config/selectComponent.theme.types";
import {z} from "@AppBuilderLib/shared/lib/zod";

/** Theme `defaultProps` for `useProps("ParameterSelectComponent", …)`. */
export const ParameterSelectComponentThemeDefaultPropsSchema = z.strictObject({
	componentSettings: z
		.record(z.string(), selectComponentOverridesSchema)
		.optional(),
});

export type ParameterSelectComponentThemeDefaultProps = z.infer<
	typeof ParameterSelectComponentThemeDefaultPropsSchema
>;
