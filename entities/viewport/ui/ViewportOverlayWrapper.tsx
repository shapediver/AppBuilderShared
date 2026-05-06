import {
	OverlayPosition,
	OverlayStyleProps,
	OverlayWrapper,
} from "@AppBuilderLib/shared/ui/overlay";
import {useProps} from "@mantine/core";
import React from "react";
import {ViewportOverlayWrapperProps} from "../config";

/**
 * Theme defaults for viewport overlay positioning (`ViewportOverlayWrapper`).
 *
 * @docAttached
 * @configPath themeOverrides.components.ViewportOverlayWrapper.defaultProps
 * @displayName ViewportOverlayWrapper
 */
export type ViewportOverlayWrapperThemeStyleProps = OverlayStyleProps;

const defaultStyleProps: OverlayStyleProps = {
	position: {
		base: OverlayPosition.TOP_MIDDLE,
		md: OverlayPosition.TOP_RIGHT,
	},
};

export default function ViewportOverlayWrapper(
	props: ViewportOverlayWrapperProps & Partial<OverlayStyleProps>,
) {
	const {children = <></>, ...rest} = props;
	const _props = useProps("ViewportOverlayWrapper", defaultStyleProps, rest);

	return <OverlayWrapper {..._props}>{children}</OverlayWrapper>;
}
