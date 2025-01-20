import { useProps } from "@mantine/core";
import React from "react";
import OverlayWrapper, { OverlayStyleProps, OverlayPosition } from "../ui/OverlayWrapper";
import { ViewportOverlayWrapperProps } from "shared/types/shapediver/viewportOverlayWrapper";

const defaultStyleProps: OverlayStyleProps = {
	position: {
		base: OverlayPosition.TOP_MIDDLE,
		md: OverlayPosition.TOP_RIGHT,
	},
};

export default function ViewportOverlayWrapper(props: ViewportOverlayWrapperProps & Partial<OverlayStyleProps>) {

	const { children = <></>, ...rest } = props;
	const _props = useProps("ViewportOverlayWrapper", defaultStyleProps, rest);

	return <OverlayWrapper {..._props}>
		{ children }
	</OverlayWrapper>;
}
