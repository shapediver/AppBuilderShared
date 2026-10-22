import {removeClosingPoint} from "@shapediver/viewer.features.drawing-tools";

type Point = readonly number[];

const pointsEqual = (a: Point, b: Point): boolean =>
	a.length === b.length && a.every((value, i) => value === b[i]);

/**
 * Whether two drawing point lists describe the same drawing. For a closed
 * drawing a closing point which repeats the first point is ignored (the
 * drawing tools do not store it, see removeClosingPoint), otherwise the
 * drawing is dirty without any change by the user. An open drawing keeps such
 * a point: it is a point the user placed.
 */
export const drawingPointsEqual = (
	a: readonly Point[] | undefined,
	b: readonly Point[] | undefined,
	closed = true,
): boolean => {
	if (!a || !b) return a === b;
	const left = closed ? removeClosingPoint(a) : a;
	const right = closed ? removeClosingPoint(b) : b;
	return (
		left.length === right.length &&
		left.every((point, i) => pointsEqual(point, right[i]))
	);
};
