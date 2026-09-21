import type {MantineThemeComponent} from "@mantine/core";
import type {InteractionEffect} from "@shapediver/viewer.shared.types";
import type {ParameterRectangleTransformComponentThemeDefaultProps} from "../parameterRectangleTransformComponent.theme.types";
import type {ParameterInteractionConfirmCancelThemeProps} from "./parameterInteractionButtonTheme";

export interface ParameterRectangleTransformComponentStyleProps extends ParameterInteractionConfirmCancelThemeProps {
	selectionColor?: InteractionEffect;
	availableColor?: InteractionEffect;
	hoverColor?: InteractionEffect;
}

export type ParameterRectangleTransformComponentThemePropsInput =
	Partial<ParameterRectangleTransformComponentThemeDefaultProps>;

export function ParameterRectangleTransformComponentThemeProps(
	props: ParameterRectangleTransformComponentThemePropsInput,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}
