import type {MantineThemeComponent} from "@mantine/core";
import type {InteractionEffect} from "@shapediver/viewer.shared.types";
import type {ParameterSelectionComponentThemeDefaultProps} from "./parameterInteractionThemeDefaultProps";

/**
 * @docAttached
 * @configPath themeOverrides.components.ParameterSelectionComponent.defaultProps
 * @displayName ParameterSelectionComponent
 */
export interface ParameterSelectionComponentStyleProps {
	selectionColor?: InteractionEffect;
	availableColor?: InteractionEffect;
	hoverColor?: InteractionEffect;
}

export type ParameterSelectionComponentThemePropsInput =
	Partial<ParameterSelectionComponentThemeDefaultProps>;

export function ParameterSelectionComponentThemeProps(
	props: ParameterSelectionComponentThemePropsInput,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}
