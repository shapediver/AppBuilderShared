import {
	AppBuilderToolbarAlign,
	AppBuilderToolbarSide,
} from "../../config/appbuilder";
import {getToolbarIconLabelLayout} from "../getToolbarIconLabelLayout";

const sides: AppBuilderToolbarSide[] = ["top", "bottom", "left", "right"];
const aligns: AppBuilderToolbarAlign[] = ["start", "center", "end"];

describe("getToolbarIconLabelLayout", () => {
	it.each(sides.flatMap((side) => aligns.map((align) => [side, align])))(
		"maps %s × %s to flex direction, order, and align-items",
		(side, align) => {
			const layout = getToolbarIconLabelLayout(side, align);

			expect(layout.flexDirection).toBe(
				side === "top" || side === "bottom" ? "column" : "row",
			);
			expect(layout.labelFirst).toBe(side === "top" || side === "left");
			expect(layout.alignItems).toBe(align);
			expect(layout.verticalCaption).toBe(
				side === "left" || side === "right",
			);
			expect(layout.captionRotate).toBe(side === "left" ? 180 : 0);
		},
	);

	it.each(sides)("defaults align to center for %s", (side) => {
		expect(getToolbarIconLabelLayout(side).alignItems).toBe("center");
	});
});
