import type {
	IDraggingParameterProps,
	IGumballTransformParameterProps,
	ISelectionParameterProps,
} from "@shapediver/viewer.shared.types";
import type {ParameterInteractionConfirmCancelClearThemeProps} from "./parameterInteractionButtonTheme";

/**
 * @docAttached
 * @category entity
 * @configPath themeOverrides.components.ParameterDraggingComponent.defaultProps
 * @displayName ParameterDraggingComponent
 */
export interface ParameterDraggingComponentThemeDefaultProps
	extends
		IDraggingParameterProps,
		ParameterInteractionConfirmCancelClearThemeProps {}

/**
 * @docAttached
 * @category entity
 * @configPath themeOverrides.components.ParameterGumballComponent.defaultProps
 * @displayName ParameterGumballComponent
 */
export interface ParameterGumballComponentThemeDefaultProps
	extends
		IGumballTransformParameterProps,
		ParameterInteractionConfirmCancelClearThemeProps {}

/**
 * @docAttached
 * @category entity
 * @configPath themeOverrides.components.ParameterSelectionComponent.defaultProps
 * @displayName ParameterSelectionComponent
 */
export interface ParameterSelectionComponentThemeDefaultProps
	extends
		ISelectionParameterProps,
		ParameterInteractionConfirmCancelClearThemeProps {}

/**
 * @docAttached
 * @category entity
 * @configPath themeOverrides.components.ParameterDrawingComponent.defaultProps
 * @displayName ParameterDrawingComponent
 */
export interface ParameterDrawingComponentThemeDefaultProps extends ParameterInteractionConfirmCancelClearThemeProps {}
