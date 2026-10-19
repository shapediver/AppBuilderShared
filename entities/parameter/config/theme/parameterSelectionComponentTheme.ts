import type {MantineThemeComponent} from "@mantine/core";
import type {InteractionEffect} from "@shapediver/viewer.shared.types";
import type {ParameterInteractionConfirmCancelClearThemeProps} from "./parameterInteractionButtonTheme";
import type {ParameterSelectionComponentThemeDefaultProps} from "./parameterInteractionThemeDefaultProps";

export interface ParameterSelectionComponentStyleProps extends ParameterInteractionConfirmCancelClearThemeProps {
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
