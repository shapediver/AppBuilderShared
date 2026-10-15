import {
	computeToolbarPushOffsets,
	getToolbarSlotStyle,
	groupToolbarsBySlot,
	mergeMeasuredSlotThickness,
	slotCrossAxisPx,
} from "../appBuilderToolbarLayerLayout";

describe("slotCrossAxisPx", () => {
	const element = {offsetWidth: 48, offsetHeight: 72};

	it("uses height for horizontal toolbars and width for vertical toolbars", () => {
		expect(slotCrossAxisPx("top", element)).toBe(72);
		expect(slotCrossAxisPx("bottom", element)).toBe(72);
		expect(slotCrossAxisPx("left", element)).toBe(48);
		expect(slotCrossAxisPx("right", element)).toBe(48);
	});
});

describe("mergeMeasuredSlotThickness", () => {
	it("keeps the last positive size while a slot is hidden", () => {
		expect(
			mergeMeasuredSlotThickness({"top:start": 64}, {}, ["top:start"]),
		).toEqual({"top:start": 64});
	});

	it("does not invent a size for a slot that has never been shown", () => {
		expect(mergeMeasuredSlotThickness({}, {}, ["top:start"])).toEqual({});
	});

	it("replaces the stored size when the slot is measured again", () => {
		expect(
			mergeMeasuredSlotThickness({"top:start": 64}, {"top:start": 80}, [
				"top:start",
			]),
		).toEqual({"top:start": 80});
	});

	it("drops a slot that left the DOM", () => {
		expect(mergeMeasuredSlotThickness({"top:start": 64}, {}, [])).toEqual(
			{},
		);
	});
});

describe("computeToolbarPushOffsets", () => {
	it("pushes a left-start toolbar by the measured top-start thickness", () => {
		const slotEntries = groupToolbarsBySlot([
			{side: "top" as const, align: "start" as const, order: 0},
			{side: "left" as const, align: "start" as const, order: 1},
		]);
		const offsets = computeToolbarPushOffsets({
			slotEntries,
			thicknessBySlot: {"top:start": 64, "left:start": 40},
		});

		expect(offsets["left:start"]).toEqual({px: 64, axis: "top"});
		expect(offsets["top:start"]).toBeUndefined();
	});

	it("pushes a top-start toolbar by the measured left-start thickness", () => {
		const slotEntries = groupToolbarsBySlot([
			{side: "top" as const, align: "start" as const, order: 1},
			{side: "left" as const, align: "start" as const, order: 0},
		]);
		const offsets = computeToolbarPushOffsets({
			slotEntries,
			thicknessBySlot: {"top:start": 36, "left:start": 80},
		});

		expect(offsets["top:start"]).toEqual({px: 80, axis: "left"});
	});
});

describe("getToolbarSlotStyle", () => {
	it("keeps the edge offset in CSS and adds the measured thickness", () => {
		const style = getToolbarSlotStyle(
			"left",
			"start",
			"0.5em",
			"0.5em",
			64,
			"top",
		);

		expect(style.top).toBe("calc(0.5em + 64px + 0.5em)");
		expect(style.left).toBe("0.5em");
	});

	it("does not add a gap when nothing was measured", () => {
		const style = getToolbarSlotStyle(
			"left",
			"start",
			"0.5em",
			"0.5em",
			0,
			"top",
		);

		expect(style.top).toBe("0.5em");
	});
});
