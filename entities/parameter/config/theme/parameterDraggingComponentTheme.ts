import type {MantineThemeComponent} from "@mantine/core";
import type {InteractionEffect} from "@shapediver/viewer.shared.types";

/**
 * @docAttached
 * @configPath themeOverrides.components.ParameterDraggingComponent.defaultProps
 * @displayName ParameterDraggingComponent
 */
export interface ParameterDraggingComponentStyleProps {
	draggingColor?: InteractionEffect;
	availableColor?: InteractionEffect;
	hoverColor?: InteractionEffect;
}

export type ParameterDraggingComponentThemePropsInput =
	Partial<ParameterDraggingComponentStyleProps>;

export function ParameterDraggingComponentThemeProps(
	props: ParameterDraggingComponentThemePropsInput,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}
