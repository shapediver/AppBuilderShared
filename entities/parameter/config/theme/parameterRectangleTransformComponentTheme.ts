import type {MantineThemeComponent} from "@mantine/core";
import type {InteractionEffect} from "@shapediver/viewer.shared.types";

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
