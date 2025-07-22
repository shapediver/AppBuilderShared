import {OverlayStyleProps} from "@AppBuilderShared/components/shapediver/ui/OverlayWrapper";
import {
	MantineShadow,
	MantineSpacing,
	MantineStyleProp,
	MantineThemeComponent,
	PaperProps,
} from "@mantine/core";
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
}

export interface ViewportIconsOptionalProps {
	/**
	 * Style properties for the container
	 */
	style?: React.CSSProperties;
	/**
	 * Shadow of the container
	 */
	shadow?: MantineShadow;
	/**
	 * Padding of the container
	 */
	py?: MantineSpacing;
	/**
	 * Padding of the container
	 */
	px?: MantineSpacing;
	/**
	 * Icon props
	 */
	iconProps?: {
		/**
		 * Button variant
		 */
		variant?: string;
		/**
		 * Button variant when disabled
		 */
		variantDisabled?: string;
		/**
		 * Style for individual icons
		 */
		style?: MantineStyleProp;
	};
	/**
	 * ID of the fullscreen area
	 */
	fullscreenId?: string;
	/**
	 * enable/disable the "parameter history" buttons
	 */
	enableHistoryButtons?: boolean;
	/**
	 * enable/disable the "model state" buttons
	 */
	enableModelStateButtons?: boolean;
	/**
	 * enable/disable the "import/export JSON file" buttons
	 */
	enableImportExportButtons?: boolean;
	/**
	 * enable/disable the "reset parameter values" button
	 */
	enableResetButton?: boolean;
	/**
	 * enable/disable the "AR" button
	 */
	enableArBtn?: boolean;
	/**
	 * enable/disable the "cameras" button
	 */
	enableCamerasBtn?: boolean;
	/**
	 * enable/disable the "fullscreen" button
	 */
	enableFullscreenBtn?: boolean;
	/**
	 * enable/disable the "zoom" button
	 */
	enableZoomBtn?: boolean;
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
}

type ViewportIconsThemePropsType = Partial<ViewportIconsOptionalProps>;

export function ViewportIconsThemeProps(
	props: ViewportIconsThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}
