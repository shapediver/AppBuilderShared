import {MantineThemeComponent} from "@mantine/core";
import {
	BUSY_MODE_DISPLAY,
	SPINNER_POSITIONING,
	ViewportCreationDefinition,
} from "@shapediver/viewer.session";

/**
 * Redeclaration of ViewportCreationDefinition to always have an id.
 */
export interface ViewportCreateDto extends ViewportCreationDefinition {
	showStatistics?: boolean;
}

export interface ViewportComponentProps extends ViewportCreateDto {
	children?: React.ReactNode;
	className?: string;
}

interface ViewportBranding {
	/**
	 * Optional URL to a logo to be displayed while the viewport is hidden.
	 * A default logo will be used if none is provided.
	 * Supply null to display no logo at all.
	 */
	logo?: string | null;
	/**
	 * Optional background color to show while the viewport is hidden, can include alpha channel.
	 * A default color will be used if none is provided.
	 */
	backgroundColor?: string;
	/**
	 * Optional URL to a logo to be displayed while the viewport is in busy mode.
	 * A default logo will be used if none is provided.
	 * The positioning of the spinner can be influenced via {@link SPINNER_POSITIONING}.
	 */
	busyModeSpinner?: string;
	/**
	 * The mode used to indicate that the viewport is busy. (default: BUSY_MODE_DISPLAY.SPINNER)
	 * Whenever the busy mode gets toggled, the events {@link EVENTTYPE_VIEWPORT.BUSY_MODE_ON} and {@link EVENTTYPE_VIEWPORT.BUSY_MODE_OFF} will be emitted.
	 */
	busyModeDisplay?: BUSY_MODE_DISPLAY;
	/**
	 * Where the spinner that is specified by {@link BUSY_MODE_DISPLAY} is desplayed on the screen. (default: BUSY_MODE_DISPLAY.BOTTOM_RIGHT)
	 */
	spinnerPositioning?: SPINNER_POSITIONING;
}

export interface ViewportBrandingProps {
	/** Branding settings for dark scheme */
	dark: ViewportBranding;
	/** Branding settings for light scheme */
	light: ViewportBranding;
}

type ViewportComponentThemePropsType = Partial<
	Omit<ViewportCreateDto, "canvas" | "id">
>;

export function ViewportComponentThemeProps(
	props: ViewportComponentThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

type ViewportBrandingThemePropsType = Partial<ViewportBrandingProps>;

export function ViewportBrandingThemeProps(
	props: ViewportBrandingThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}
