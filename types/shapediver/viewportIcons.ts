import {
	ActionIconVariant,
	MantineStyleProp,
	MantineThemeComponent,
} from "@mantine/core";

export interface ViewportIconsProps {
	viewportId?: string;
}

export interface ViewportIconsOptionalProps {
	color: string;
	colorDisabled: string;
	enableArBtn: boolean;
	enableCamerasBtn: boolean;
	enableFullscreenBtn: boolean;
	enableZoomBtn: boolean;
	fullscreenId: string;
	iconStyle: MantineStyleProp;
	size: number;
	style: MantineStyleProp;
	variant: ActionIconVariant;
	variantDisabled: ActionIconVariant;
}

type ViewportIconsThemePropsType = Partial<ViewportIconsOptionalProps>;

export function ViewportIconsThemeProps(
	props: ViewportIconsThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}
