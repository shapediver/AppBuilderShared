import {OverlayStyleProps} from "@AppBuilderLib/shared/ui/overlay";
import {MantineThemeComponent} from "@mantine/core";

export interface ViewportOverlayWrapperProps {
	children?: React.ReactNode;
}

type ViewportOverlayWrapperThemePropsType = Partial<OverlayStyleProps>;

export function ViewportOverlayWrapperThemeProps(
	props: ViewportOverlayWrapperThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}
