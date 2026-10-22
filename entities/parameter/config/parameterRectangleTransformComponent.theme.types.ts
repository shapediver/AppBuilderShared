import {
	IRectangleTransformParameterPropsJsonSchema,
	type IRectangleTransformParameterProps,
} from "@shapediver/viewer.shared.types";
import type {ParameterInteractionConfirmCancelClearThemeProps} from "./theme/parameterInteractionButtonTheme";
import {parameterInteractionConfirmCancelClearThemeSchema} from "./theme/parameterInteractionButtonTheme";

export const ParameterRectangleTransformComponentThemeDefaultPropsSchema =
	IRectangleTransformParameterPropsJsonSchema.and(
		parameterInteractionConfirmCancelClearThemeSchema,
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
		ParameterInteractionConfirmCancelClearThemeProps {}
