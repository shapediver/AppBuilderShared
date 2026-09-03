import type {MantineThemeComponent} from "@mantine/core";
import type {InteractionEffect} from "@shapediver/viewer.shared.types";
import type {ParameterDraggingComponentThemeDefaultProps} from "./parameterInteractionThemeDefaultProps";

export interface ParameterDraggingComponentStyleProps {
	draggingColor?: InteractionEffect;
	availableColor?: InteractionEffect;
	hoverColor?: InteractionEffect;
}

export type ParameterDraggingComponentThemePropsInput =
	Partial<ParameterDraggingComponentThemeDefaultProps>;

export function ParameterDraggingComponentThemeProps(
	props: ParameterDraggingComponentThemePropsInput,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}
