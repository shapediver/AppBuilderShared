import {z} from "@AppBuilderLib/shared/lib/zod";
import {IRectangleTransformParameterPropsJsonSchema} from "@shapediver/viewer.shared.types";

/** Theme `defaultProps` for `useProps("ParameterRectangleTransformComponent", …)`. */
export const ParameterRectangleTransformComponentThemeDefaultPropsSchema =
	IRectangleTransformParameterPropsJsonSchema;

export type ParameterRectangleTransformComponentThemeDefaultProps = z.infer<
	typeof ParameterRectangleTransformComponentThemeDefaultPropsSchema
>;
