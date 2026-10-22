import {
	hasLocalTransformationDelta,
	mergeTransformationEvent,
} from "../transformedNodes";

const matrix = (translateX: number) => [
	1,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	1,
	0,
	translateX,
	0,
	0,
	1,
];

const event = (ids: string[], offsets: number[]) => ({
	nodes: ids.map((id) => ({id})),
	transformations: offsets.map((offset) => matrix(offset)),
	localTransformations: offsets.map((offset) => matrix(offset - 1)),
});

describe("mergeTransformationEvent", () => {
	const names = new Map([
		["node-a", "Boxes.box_a"],
		["node-b", "Boxes.box_b"],
	]);

	it("assigns each node its own matrix", () => {
		const result = mergeTransformationEvent(
			[],
			event(["node-a", "node-b"], [10, 20]),
			names,
			["Boxes.box_a", "Boxes.box_b"],
		);
		expect(result).toEqual([
			{
				name: "Boxes.box_a",
				transformation: matrix(10),
				localTransformations: matrix(9),
			},
			{
				name: "Boxes.box_b",
				transformation: matrix(20),
				localTransformations: matrix(19),
			},
		]);
	});

	it("keeps the order of the event independent of the selection order", () => {
		const result = mergeTransformationEvent(
			[],
			event(["node-b", "node-a"], [20, 10]),
			names,
			["Boxes.box_a", "Boxes.box_b"],
		);
		expect(
			Object.fromEntries(
				result.map((node) => [node.name, node.transformation[12]]),
			),
		).toEqual({"Boxes.box_a": 10, "Boxes.box_b": 20});
	});

	it("updates existing entries without mutating them", () => {
		const existing = {
			name: "Boxes.box_a",
			transformation: matrix(1),
			localTransformations: matrix(0),
		};
		const current = [existing];
		const result = mergeTransformationEvent(
			current,
			event(["node-a"], [5]),
			names,
			["Boxes.box_a"],
		);
		expect(result).not.toBe(current);
		expect(existing.transformation).toEqual(matrix(1));
		expect(result).toEqual([
			{
				name: "Boxes.box_a",
				transformation: matrix(5),
				localTransformations: matrix(4),
			},
		]);
	});

	it("keeps previously transformed nodes that are not part of the event", () => {
		const other = {name: "Boxes.box_c", transformation: matrix(3)};
		const result = mergeTransformationEvent(
			[other],
			event(["node-a"], [5]),
			names,
			["Boxes.box_a"],
		);
		expect(result.map((node) => node.name)).toEqual([
			"Boxes.box_c",
			"Boxes.box_a",
		]);
	});

	it("falls back to the single selected name for a single unknown node", () => {
		const result = mergeTransformationEvent(
			[],
			event(["unknown"], [7]),
			new Map(),
			["Boxes.box_a"],
		);
		expect(result.map((node) => node.name)).toEqual(["Boxes.box_a"]);
	});

	it("skips unknown nodes when several are transformed", () => {
		const result = mergeTransformationEvent(
			[],
			event(["unknown", "node-b"], [7, 8]),
			names,
			["Boxes.box_a", "Boxes.box_b"],
		);
		expect(result.map((node) => node.name)).toEqual(["Boxes.box_b"]);
	});

	it("skips nodes that are no longer selected", () => {
		const result = mergeTransformationEvent(
			[],
			event(["node-a", "node-b"], [1, 2]),
			names,
			["Boxes.box_b"],
		);
		expect(result.map((node) => node.name)).toEqual(["Boxes.box_b"]);
	});
});

describe("hasLocalTransformationDelta", () => {
	const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
	const translated = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 3, 0, 0, 1];

	it("ignores nodes without local transformations (committed values)", () => {
		expect(hasLocalTransformationDelta([{}])).toBe(false);
	});

	it("ignores identity gizmos after a selection (within epsilon)", () => {
		expect(
			hasLocalTransformationDelta([
				{localTransformations: identity},
				{localTransformations: identity.map((v) => v + 1e-7)},
			]),
		).toBe(false);
	});

	it("detects a moved handle", () => {
		expect(
			hasLocalTransformationDelta([
				{localTransformations: identity},
				{localTransformations: translated},
			]),
		).toBe(true);
	});

	it("treats a malformed matrix as no delta", () => {
		expect(
			hasLocalTransformationDelta([{localTransformations: [1, 0, 0, 1]}]),
		).toBe(false);
	});
});
