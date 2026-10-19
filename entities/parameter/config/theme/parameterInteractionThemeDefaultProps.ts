import type {
	IDraggingParameterProps,
	IGumballTransformParameterProps,
	ISelectionParameterProps,
} from "@shapediver/viewer.shared.types";
import type {
	ParameterInteractionConfirmCancelClearThemeProps,
	ParameterInteractionConfirmCancelThemeProps,
} from "./parameterInteractionButtonTheme";

/**
 * @docAttached
 * @category entity
 * @configPath themeOverrides.components.ParameterDraggingComponent.defaultProps
 * @displayName ParameterDraggingComponent
 */
export interface ParameterDraggingComponentThemeDefaultProps
	extends
		IDraggingParameterProps,
		ParameterInteractionConfirmCancelThemeProps {}

/**
 * @docAttached
 * @category entity
 * @configPath themeOverrides.components.ParameterGumballComponent.defaultProps
 * @displayName ParameterGumballComponent
 */
export interface ParameterGumballComponentThemeDefaultProps
	extends
		IGumballTransformParameterProps,
		ParameterInteractionConfirmCancelThemeProps {}

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
