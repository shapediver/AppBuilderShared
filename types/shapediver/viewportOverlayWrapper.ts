import { OverlayStyleProps } from "@AppBuilderShared/components/shapediver/ui/OverlayWrapper";
import { MantineThemeComponent } from "@mantine/core";

export interface ViewportOverlayWrapperProps {
	children?: React.ReactNode;
}

type ViewportOverlayWrapperThemePropsType = Partial<OverlayStyleProps>;

export function ViewportOverlayWrapperThemeProps(props: ViewportOverlayWrapperThemePropsType): MantineThemeComponent {
	return {
		defaultProps: props
	};
}
