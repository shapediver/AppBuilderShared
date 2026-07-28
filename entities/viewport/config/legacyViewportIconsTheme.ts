import type {MantineDividerProps} from "@AppBuilderLib/shared/mantine-props/divider";
import type {MantinePaperProps} from "@AppBuilderLib/shared/mantine-props/paper";
import type {MantineTransitionProps} from "@AppBuilderLib/shared/mantine-props/transition";
import {MantineStyleProp, MantineThemeComponent} from "@mantine/core";
import React from "react";
import {ViewportTransparentBackgroundStyle} from "./viewport";

type ViewportToolbarVisibilityOptions = {
	history?: boolean;
	reset?: boolean;
	ar?: boolean;
	cameras?: boolean;
	fullscreen?: boolean;
	fullscreen3States?: boolean;
	zoom?: boolean;
	historyMenu?: boolean;
};

/**
 * Optional styling and feature toggles for the viewport icon toolbar (`ViewportIcons`).
 *
 * @docAttached
 * @category entity
 * @configPath themeOverrides.components.ViewportIcons.defaultProps
 * @displayName ViewportIcons
 */
export interface LegacyViewportIconsThemeProps {
	/**
	 * Style properties for the container
	 */
	style?: React.CSSProperties;
	/**
	 * ID of the fullscreen area
	 */
	fullscreenId?: string;
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
	 * Legacy visibility flag mapped to default toolbar options.
	 * @deprecated Use App Builder toolbar configuration instead.
	 */
	enableHistoryButtons?: boolean;
	/**
	 * Legacy visibility flag mapped to default toolbar options.
	 * @deprecated Use App Builder toolbar configuration instead.
	 */
	enableModelStateButtons?: boolean;
	/**
	 * Legacy visibility flag mapped to default toolbar options.
	 * @deprecated Use App Builder toolbar configuration instead.
	 */
	enableImportExportButtons?: boolean;
	/**
	 * Legacy visibility flag mapped to default toolbar options.
	 * @deprecated Use App Builder toolbar configuration instead.
	 */
	enableResetButton?: boolean;
	/**
	 * Legacy visibility flag mapped to default toolbar options.
	 * @deprecated Use App Builder toolbar configuration instead.
	 */
	enableArBtn?: boolean;
	/**
	 * Legacy visibility flag mapped to default toolbar options.
	 * @deprecated Use App Builder toolbar configuration instead.
	 */
	enableCamerasBtn?: boolean;
	/**
	 * Legacy visibility flag mapped to default toolbar options.
	 * @deprecated Use App Builder toolbar configuration instead.
	 */
	enableFullscreenBtn?: boolean;
	/**
	 * Legacy visibility flag mapped to default toolbar options.
	 * @deprecated Use App Builder toolbar configuration instead.
	 */
	enableFullscreenBtn3States?: boolean;
	/**
	 * Legacy visibility flag mapped to default toolbar options.
	 * @deprecated Use App Builder toolbar configuration instead.
	 */
	enableZoomBtn?: boolean;
	/**
	 * Legacy visibility flag mapped to default toolbar options.
	 * @deprecated Use App Builder toolbar configuration instead.
	 */
	enableHistoryMenuButton?: boolean;
	/** @deprecated Legacy overlay props are accepted for compatibility only. */
	viewportOverlayProps?: unknown;
	/**
	 * paper props
	 */
	paperProps?: MantinePaperProps;
	/**
	 * divider props
	 */
	dividerProps?: MantineDividerProps;
	/**
	 * transition props
	 */
	transitionProps?: MantineTransitionProps;
}

type LegacyViewportIconsThemePropsType = Partial<LegacyViewportIconsThemeProps>;

export function LegacyViewportIconsThemeProps(
	props: LegacyViewportIconsThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

export const legacyViewportIconsDefaultDividerProps: MantineDividerProps = {
	orientation: "vertical",
	color: "var(--mantine-color-disabled-color)",
};

export const legacyViewportIconsDefaultTransitionProps: MantineTransitionProps =
	{
		transition: "fade-down",
		duration: 400,
		timingFunction: "ease",
		keepMounted: true,
	};

export const legacyViewportIconsDefaultStyleProps: LegacyViewportIconsThemeProps =
	{
		style: {
			display: "flex",
			gap: "0.25rem",
			alignItems: "center",
			flexDirection: "row",
			border: "none",
			...ViewportTransparentBackgroundStyle,
		},
		fullscreenId: "viewer-fullscreen-area",
		paperProps: {
			py: 1,
			px: 2,
			shadow: "md",
		},
		dividerProps: legacyViewportIconsDefaultDividerProps,
		transitionProps: legacyViewportIconsDefaultTransitionProps,
	};

export function mapLegacyViewportIconsThemeToDefaultToolbarOptions(
	props: LegacyViewportIconsThemeProps,
): {
	showButtons: ViewportToolbarVisibilityOptions;
	enableImportExportButtons?: boolean;
	enableModelStateButtons?: boolean;
} {
	const {
		enableHistoryButtons,
		enableModelStateButtons,
		enableImportExportButtons,
		enableResetButton,
		enableArBtn,
		enableCamerasBtn,
		enableFullscreenBtn,
		enableFullscreenBtn3States,
		enableZoomBtn,
		enableHistoryMenuButton,
	} = props;

	return {
		showButtons: {
			history: enableHistoryButtons,
			reset: enableResetButton,
			ar: enableArBtn,
			cameras: enableCamerasBtn,
			fullscreen: enableFullscreenBtn3States
				? false
				: enableFullscreenBtn,
			fullscreen3States: enableFullscreenBtn3States,
			zoom: enableZoomBtn,
			historyMenu:
				enableImportExportButtons !== undefined ||
				enableModelStateButtons !== undefined
					? !!enableImportExportButtons || !!enableModelStateButtons
					: enableHistoryMenuButton,
		},
		enableImportExportButtons,
		enableModelStateButtons,
	};
}
