import type {
	IDraggingParameterProps,
	IGumballTransformParameterProps,
	ISelectionParameterProps,
} from "@shapediver/viewer.shared.types";

/**
 * @docAttached
 * @category entity
 * @configPath themeOverrides.components.ParameterDraggingComponent.defaultProps
 * @displayName ParameterDraggingComponent
 */
export interface ParameterDraggingComponentThemeDefaultProps extends IDraggingParameterProps {}

/**
 * @docAttached
 * @category entity
 * @configPath themeOverrides.components.ParameterGumballComponent.defaultProps
 * @displayName ParameterGumballComponent
 */
export interface ParameterGumballComponentThemeDefaultProps extends IGumballTransformParameterProps {}

/**
 * @docAttached
 * @category entity
 * @configPath themeOverrides.components.ParameterSelectionComponent.defaultProps
 * @displayName ParameterSelectionComponent
 */
export interface ParameterSelectionComponentThemeDefaultProps extends ISelectionParameterProps {}
