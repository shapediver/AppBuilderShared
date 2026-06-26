import {IRectangleTransformParameterPropsJsonSchema} from "@shapediver/viewer.shared.types";
import {z} from "zod";

/** Theme `defaultProps` for `useProps("ParameterRectangleTransformComponent", …)`. */
export const ParameterRectangleTransformComponentThemeDefaultPropsSchema =
	IRectangleTransformParameterPropsJsonSchema;

export type ParameterRectangleTransformComponentThemeDefaultProps = z.infer<
	typeof ParameterRectangleTransformComponentThemeDefaultPropsSchema
>;
