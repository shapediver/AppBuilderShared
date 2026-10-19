export type AnchorPointerEvents = "auto" | "none";

/**
 * A camera action disables pointer events only on a closed preview trigger,
 * so orbiting cannot open it. An open container stays clickable for the whole
 * camera action, including one that does not visibly move the camera.
 * `allowPointerEvents: false` still lets clicks pass through that open container.
 */
export function anchorPointerEvents(options: {
	allowPointerEventsGlobal: boolean;
	allowPointerEvents?: boolean;
	showContent: boolean;
}): AnchorPointerEvents {
	const cameraBlocksClosedTrigger =
		!options.allowPointerEventsGlobal && !options.showContent;
	const containerPassesThrough =
		options.allowPointerEvents === false && options.showContent;

	return cameraBlocksClosedTrigger || containerPassesThrough
		? "none"
		: "auto";
}
