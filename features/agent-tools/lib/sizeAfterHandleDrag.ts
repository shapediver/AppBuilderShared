export type HandleEdgeX = "left" | "right";
export type HandleEdgeY = "top" | "bottom";

/**
 * Size after dragging a resize handle.
 * The named edges move with the pointer; the opposite edges stay fixed.
 */
export function sizeAfterHandleDrag(args: {
	startWidth: number;
	startHeight: number;
	startClientX: number;
	startClientY: number;
	clientX: number;
	clientY: number;
	minWidth: number;
	minHeight: number;
	maxWidth: number;
	maxHeight: number;
	edgeX: HandleEdgeX;
	edgeY: HandleEdgeY;
}): {width: number; height: number} {
	const widthDelta =
		args.edgeX === "left"
			? args.startClientX - args.clientX
			: args.clientX - args.startClientX;
	const heightDelta =
		args.edgeY === "top"
			? args.startClientY - args.clientY
			: args.clientY - args.startClientY;
	return {
		width: clamp(
			args.startWidth + widthDelta,
			args.minWidth,
			args.maxWidth,
		),
		height: clamp(
			args.startHeight + heightDelta,
			args.minHeight,
			args.maxHeight,
		),
	};
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}
