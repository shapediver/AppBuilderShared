import type {MantineThemeComponent} from "@mantine/core";
import type {InteractionEffect} from "@shapediver/viewer.shared.types";

/**
 * @docAttached
 * @category entity
 * @configPath themeOverrides.components.ParameterRectangleTransformComponent.defaultProps
 * @displayName ParameterRectangleTransformComponent
 */
export interface ParameterRectangleTransformComponentStyleProps {
	selectionColor?: InteractionEffect;
	availableColor?: InteractionEffect;
	hoverColor?: InteractionEffect;
}

export type ParameterRectangleTransformComponentThemePropsInput =
	Partial<ParameterRectangleTransformComponentStyleProps>;

export function ParameterRectangleTransformComponentThemeProps(
	props: ParameterRectangleTransformComponentThemePropsInput,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}
