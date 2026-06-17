import OverlayWrapper, {
	OverlayPosition,
	OverlayStyleProps,
} from "@AppBuilderLib/shared/ui/overlay/OverlayWrapper";
import {useProps} from "@mantine/core";
import {ViewportOverlayWrapperProps} from "../config/viewportOverlayWrapper";

/**
 * Theme defaults for viewport overlay positioning (`ViewportOverlayWrapper`).
 *
 * @docAttached
 * @category entity
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
