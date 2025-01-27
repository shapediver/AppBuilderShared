import {MantineThemeComponent, useProps} from "@mantine/core";
import React from "react";
import OverlayWrapper, {
	OverlayPosition,
	OverlayStyleProps,
} from "@AppBuilderShared/components/shapediver/ui/OverlayWrapper";

interface Props {
	children?: React.ReactNode;
}

const defaultStyleProps: OverlayStyleProps = {
	position: OverlayPosition.TOP_RIGHT,
	offset: "1rem",
};

type ModelCardOverlayWrapperThemePropsType = Partial<OverlayStyleProps>;

export function ModelCardOverlayWrapperThemeProps(
	props: ModelCardOverlayWrapperThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

export default function ModelCardOverlayWrapper(
	props: Props & Partial<OverlayStyleProps>,
) {
	const {children = <></>, ...rest} = props;
	const _props = useProps("ModelCardOverlayWrapper", defaultStyleProps, rest);

	return <OverlayWrapper {..._props}>{children}</OverlayWrapper>;
}
