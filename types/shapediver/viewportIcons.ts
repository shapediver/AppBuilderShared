import {OverlayStyleProps} from "@AppBuilderShared/components/shapediver/ui/OverlayWrapper";
import {
	DividerProps,
	MantineStyleProp,
	MantineThemeComponent,
	PaperProps,
	TransitionProps,
} from "@mantine/core";
import React from "react";
import {ViewportOverlayWrapperProps} from "./viewportOverlayWrapper";

export interface ViewportIconsProps {
	/**
	 * Namespace of the session
	 */
	namespace?: string;
	/**
	 * Viewport ID
	 */
	viewportId?: string;
	/**
	 * If the JSON menu should be hidden by default.
	 */
	hideJsonMenu?: boolean;
}

export interface ViewportIconsOptionalProps {
	/**
	 * Style properties for the container
	 */
	style?: React.CSSProperties;
	/**
	 * ID of the fullscreen area
	 */
	fullscreenId?: string;
	/**
	 * enable/disable the "fullscreen" button
	 */
	enableFullscreenBtn?: boolean;
	/**
	 * color of the icons
	 */
	color?: string;
	/**
	 * color of the icons when disabled
	 */
	colorDisabled?: string;
	/**
	 * variant of the icons
	 */
	variant?: string;
	/**
	 * variant of the icons when disabled
	 */
	variantDisabled?: string;
	/**
	 * style of the icons
	 */
	iconStyle?: MantineStyleProp;
	/**
	 * size of the icons
	 */
	size?: number;
	/**
	 * viewport overlay props
	 */
	viewportOverlayProps?: ViewportOverlayWrapperProps &
		Partial<OverlayStyleProps>;
	/**
	 * paper props
	 */
	paperProps?: PaperProps;
	/**
	 * divider props
	 */
	dividerProps?: DividerProps;
	/**
	 * transition props
	 */
	transitionProps?: Partial<TransitionProps>;
}

type ViewportIconsThemePropsType = Partial<ViewportIconsOptionalProps>;

export function ViewportIconsThemeProps(
	props: ViewportIconsThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}
