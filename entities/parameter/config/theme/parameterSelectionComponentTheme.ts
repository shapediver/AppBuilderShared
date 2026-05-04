import type {MantineThemeComponent} from "@mantine/core";
import type {InteractionEffect} from "@shapediver/viewer.shared.types";

export interface ParameterSelectionComponentStyleProps {
	selectionColor?: InteractionEffect;
	availableColor?: InteractionEffect;
	hoverColor?: InteractionEffect;
}

export type ParameterSelectionComponentThemePropsInput =
	Partial<ParameterSelectionComponentStyleProps>;

export function ParameterSelectionComponentThemeProps(
	props: ParameterSelectionComponentThemePropsInput,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}
