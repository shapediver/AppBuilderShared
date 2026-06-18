/** Shared flex layout for each stack content level (Back fixed, body fills remainder). */
export const stackPaperStyle = {
	height: "100%",
	maxHeight: "100%",
	minHeight: 0,
	width: "100%",
	display: "flex",
	flexDirection: "column",
	overflow: "hidden",
} as const;

/** Flex column that fills its parent and clips overflow at each level. */
const flexColumnFill = {
	flex: 1,
	minHeight: 0,
	overflow: "hidden",
	display: "flex",
	flexDirection: "column",
} as const;

export const stackColumnStyle = flexColumnFill;

/** Passes height to nested stack; scroll is handled by AnimationWrapper. */
export const stackBodySlotStyle = flexColumnFill;

export const stackFallbackScrollStyle = {
	height: "100%",
	minHeight: 0,
	overflowX: "hidden",
	overflowY: "auto",
	scrollbarGutter: "stable",
} as const;
