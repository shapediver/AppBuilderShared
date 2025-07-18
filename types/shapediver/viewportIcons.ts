import {OverlayPositionType} from "@AppBuilderShared/components/shapediver/ui/OverlayWrapper";
import {
	MantineShadow,
	MantineSpacing,
	MantineStyleProp,
	MantineThemeComponent,
} from "@mantine/core";

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
	 * Position of the buttons
	 */
	position?: OverlayPositionType;
	/**
	 * Style properties for the container
	 */
	style?: React.CSSProperties;
	/**
	 * Offset of the container
	 */
	offset?: string;
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
}

type ViewportIconsThemePropsType = Partial<ViewportIconsOptionalProps>;

export function ViewportIconsThemeProps(
	props: ViewportIconsThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}
