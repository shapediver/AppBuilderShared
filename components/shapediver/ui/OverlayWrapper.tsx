import React, {useMemo} from "react";
import {
	ResponsiveValueType,
	useResponsiveValueSelector,
} from "@AppBuilderShared/hooks/ui/useResponsiveValueSelector";

export const OverlayPosition = {
	TOP_LEFT: "top-left",
	TOP_RIGHT: "top-right",
	BOTTOM_LEFT: "bottom-left",
	BOTTOM_RIGHT: "bottom-right",
	TOP_MIDDLE: "top-middle",
	BOTTOM_MIDDLE: "bottom-middle",
} as const;

export type OverlayPositionType =
	(typeof OverlayPosition)[keyof typeof OverlayPosition];

function getPositionStyles(offset: string | number = 0) {
	return {
		[OverlayPosition.TOP_LEFT]: {
			top: `${offset}`,
			left: `${offset}`,
		},
		[OverlayPosition.TOP_RIGHT]: {
			top: `${offset}`,
			right: `${offset}`,
		},
		[OverlayPosition.BOTTOM_LEFT]: {
			bottom: `${offset}`,
			left: `${offset}`,
		},
		[OverlayPosition.BOTTOM_RIGHT]: {
			bottom: `${offset}`,
			right: `${offset}`,
		},
		[OverlayPosition.TOP_MIDDLE]: {
			top: `${offset}`,
			left: "50%",
			transform: "translateX(-50%)",
		},
		[OverlayPosition.BOTTOM_MIDDLE]: {
			bottom: `${offset}`,
			left: "50%",
			transform: "translateX(-50%)",
		},
	};
}

interface Props {
	children?: React.ReactNode;
}

export interface OverlayStyleProps {
	position: ResponsiveValueType<OverlayPositionType>;
	offset?: string;
}

export default function OverlayWrapper(
	props: Props & Partial<OverlayStyleProps>,
) {
	const {
		children = <></>,
		position: _position = OverlayPosition.TOP_LEFT,
		offset,
	} = props;

	const positionStyles = useMemo(() => getPositionStyles(offset), [offset]);

	const position = useResponsiveValueSelector(_position);

	return (
		<section style={{...positionStyles[position], position: "absolute"}}>
			{children}
		</section>
	);
}
