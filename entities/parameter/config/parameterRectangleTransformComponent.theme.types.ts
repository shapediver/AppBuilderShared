import {
	IRectangleTransformParameterPropsJsonSchema,
	type IRectangleTransformParameterProps,
} from "@shapediver/viewer.shared.types";
import type {ParameterInteractionConfirmCancelThemeProps} from "./theme/parameterInteractionButtonTheme";
import {parameterInteractionConfirmCancelThemeSchema} from "./theme/parameterInteractionButtonTheme";

export const ParameterRectangleTransformComponentThemeDefaultPropsSchema =
	IRectangleTransformParameterPropsJsonSchema.and(
		parameterInteractionConfirmCancelThemeSchema,
	);

/**
 * @docAttached
 * @category entity
 * @configPath themeOverrides.components.ParameterRectangleTransformComponent.defaultProps
 * @displayName ParameterRectangleTransformComponent
 */
export interface ParameterRectangleTransformComponentThemeDefaultProps
	extends
		IRectangleTransformParameterProps,
		ParameterInteractionConfirmCancelThemeProps {}
