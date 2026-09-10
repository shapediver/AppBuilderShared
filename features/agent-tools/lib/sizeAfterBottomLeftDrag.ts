export function sizeAfterBottomLeftDrag(args: {
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
}): {width: number; height: number} {
	const width = clamp(
		args.startWidth + (args.startClientX - args.clientX),
		args.minWidth,
		args.maxWidth,
	);
	const height = clamp(
		args.startHeight + (args.clientY - args.startClientY),
		args.minHeight,
		args.maxHeight,
	);
	return {width, height};
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}
