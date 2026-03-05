import {
	ResponsiveValueType,
	useResponsiveValueSelector,
} from "@AppBuilderLib/shared/lib/useResponsiveValueSelector";
import React, {useMemo} from "react";

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

function getPositionStyles(
	offset: string = "0",
	offsetX: string | undefined = undefined,
	offsetY: string | undefined = undefined,
) {
	return {
		[OverlayPosition.TOP_LEFT]: {
			top: offsetY ? offsetY : offset,
			left: offsetX ? offsetX : offset,
		},
		[OverlayPosition.TOP_RIGHT]: {
			top: offsetY ? offsetY : offset,
			right: offsetX ? offsetX : offset,
		},
		[OverlayPosition.BOTTOM_LEFT]: {
			bottom: offsetY ? offsetY : offset,
			left: offsetX ? offsetX : offset,
		},
		[OverlayPosition.BOTTOM_RIGHT]: {
			bottom: offsetY ? offsetY : offset,
			right: offsetX ? offsetX : offset,
		},
		[OverlayPosition.TOP_MIDDLE]: {
			top: offsetY ? offsetY : offset,
			left: "50%",
			transform: "translateX(-50%)",
		},
		[OverlayPosition.BOTTOM_MIDDLE]: {
			bottom: offsetY ? offsetY : offset,
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
	offsetX?: string;
	offsetY?: string;
	className?: string | undefined;
}

export default function OverlayWrapper(
	props: Props & Partial<OverlayStyleProps>,
) {
	const {
		children = <></>,
		className,
		position: _position = OverlayPosition.TOP_LEFT,
		offset,
		offsetX,
		offsetY,
	} = props;

	const positionStyles = useMemo(
		() => getPositionStyles(offset, offsetX, offsetY),
		[offset, offsetX, offsetY],
	);

	const position = useResponsiveValueSelector(_position);

	return (
		<section
			style={{...positionStyles[position], position: "absolute"}}
			className={className}
		>
			{children}
		</section>
	);
}
