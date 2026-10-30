import {drawingPointsEqual} from "../drawingPoints";

// The drawing-tools package of the Viewer is ESM only and not transformed by
// jest; the module is mocked with a stand-in of removeClosingPoint that has
// the same semantics (first and last point equal within 1e-7). Virtual, so
// the test also runs in hosts that do not install the package.
jest.mock(
	"@shapediver/viewer.features.drawing-tools",
	() => ({
		removeClosingPoint: (points: readonly number[][]) =>
			points.length > 1 &&
			points[0].every(
				(v, i) => Math.abs(v - points[points.length - 1][i]) < 1e-7,
			)
				? points.slice(0, -1)
				: points,
	}),
	{virtual: true},
);

const square = [
	[0, 0, 0],
	[1, 0, 0],
	[1, 1, 0],
	[0, 1, 0],
];

describe("drawingPointsEqual", () => {
	it("ignores a closing point of a closed drawing", () => {
		expect(drawingPointsEqual([...square, [0, 0, 0]], square)).toBe(true);
		expect(drawingPointsEqual(square, [...square, [0, 0, 0]])).toBe(true);
	});

	it("detects a moved point", () => {
		const moved = [...square.slice(0, 3), [0, 2, 0]];
		expect(drawingPointsEqual(square, moved)).toBe(false);
	});

	it("detects a different number of points", () => {
		expect(drawingPointsEqual(square, square.slice(0, 3))).toBe(false);
	});

	it("keeps a repeated first point of an open drawing", () => {
		const closedBack = [...square, [0, 0, 0]];
		expect(drawingPointsEqual(closedBack, square, false)).toBe(false);
		expect(drawingPointsEqual(closedBack, closedBack, false)).toBe(true);
	});

	it("handles undefined", () => {
		expect(drawingPointsEqual(undefined, undefined)).toBe(true);
		expect(drawingPointsEqual(undefined, square)).toBe(false);
	});
});
