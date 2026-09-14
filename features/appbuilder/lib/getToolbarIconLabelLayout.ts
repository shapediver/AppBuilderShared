import type {
	AppBuilderToolbarAlign,
	AppBuilderToolbarSide,
} from "../config/appbuilder";

export type ToolbarIconLabelLayout = {
	flexDirection: "column" | "row";
	alignItems: "start" | "center" | "end";
	labelFirst: boolean;
	verticalCaption: boolean;
	captionRotate: 0 | 180;
};

/** Maps toolbar caption side/align to flex layout used by icon buttons. */
export function getToolbarIconLabelLayout(
	side: AppBuilderToolbarSide,
	align: AppBuilderToolbarAlign = "center",
): ToolbarIconLabelLayout {
	const stacked = side === "top" || side === "bottom";

	return {
		flexDirection: stacked ? "column" : "row",
		alignItems: align,
		labelFirst: side === "top" || side === "left",
		verticalCaption: !stacked,
		captionRotate: side === "left" ? 180 : 0,
	};
}
