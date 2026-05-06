import type {MantineThemeComponent} from "@mantine/core";
import type {InteractionEffect} from "@shapediver/viewer.shared.types";

/**
 * @docAttached
 * @configPath themeOverrides.components.ParameterGumballComponent.defaultProps
 * @displayName ParameterGumballComponent
 */
export interface ParameterGumballComponentStyleProps {
	selectionColor?: InteractionEffect;
	availableColor?: InteractionEffect;
	hoverColor?: InteractionEffect;
}

export type ParameterGumballComponentThemePropsInput =
	Partial<ParameterGumballComponentStyleProps>;

export function ParameterGumballComponentThemeProps(
	props: ParameterGumballComponentThemePropsInput,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}
