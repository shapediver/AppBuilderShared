import type {MantineThemeComponent} from "@mantine/core";
import type {ParameterDrawingComponentThemeDefaultProps} from "./parameterInteractionThemeDefaultProps";

export type ParameterDrawingComponentThemePropsInput =
	Partial<ParameterDrawingComponentThemeDefaultProps>;

export function ParameterDrawingComponentThemeProps(
	props: ParameterDrawingComponentThemePropsInput,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}
