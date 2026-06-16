import {IRectangleTransformParameterPropsJsonSchema} from "@shapediver/viewer.shared.types/dist/interfaces/parameter/IInteractionParameterSettings";
import {z} from "zod";

/** Theme `defaultProps` for `useProps("ParameterRectangleTransformComponent", …)`. */
export const ParameterRectangleTransformComponentThemeDefaultPropsSchema =
	IRectangleTransformParameterPropsJsonSchema;

export type ParameterRectangleTransformComponentThemeDefaultProps = z.infer<
	typeof ParameterRectangleTransformComponentThemeDefaultPropsSchema
>;
