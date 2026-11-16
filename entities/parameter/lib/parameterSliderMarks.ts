export type MarkDirection = "up" | "down";

export type ParameterSliderMark = {value: number; label?: string};

/** Sorted unique mark values within [min, max]. */
export function getValidMarkValues(
	marks: ParameterSliderMark[],
	rangeMin: number,
	rangeMax: number,
): number[] {
	const values = marks
		.map((mark) => mark.value)
		.filter((v) => v >= rangeMin && v <= rangeMax);
	return Array.from(new Set(values)).sort((a, b) => a - b);
}

function markValuesEqual(a: number, b: number, decimalplaces: number): boolean {
	const tolerance = Math.pow(10, -decimalplaces) / 2;
	return Math.abs(a - b) <= tolerance;
}

/**
 * Next or previous mark value when stepping with NumberInput controls or arrow keys.
 */
export function getAdjacentMarkValue(
	current: number,
	marks: ParameterSliderMark[],
	direction: MarkDirection,
	rangeMin: number,
	rangeMax: number,
	decimalplaces: number,
): number {
	const sorted = getValidMarkValues(marks, rangeMin, rangeMax);
	if (sorted.length === 0) {
		return +current.toFixed(decimalplaces);
	}
	if (sorted.length === 1) {
		return +sorted[0].toFixed(decimalplaces);
	}

	const exactIndex = sorted.findIndex((v) =>
		markValuesEqual(v, current, decimalplaces),
	);

	if (direction === "up") {
		if (exactIndex !== -1) {
			return +sorted[Math.min(exactIndex + 1, sorted.length - 1)].toFixed(
				decimalplaces,
			);
		}
		const above = sorted.find((v) => v > current);
		return +(above ?? sorted[sorted.length - 1]).toFixed(decimalplaces);
	}

	if (exactIndex !== -1) {
		return +sorted[Math.max(exactIndex - 1, 0)].toFixed(decimalplaces);
	}
	const below = [...sorted].reverse().find((v) => v < current);
	return +(below ?? sorted[0]).toFixed(decimalplaces);
}

/**
 * Round and clamp the number to the given min, max and step.
 * @param min The minimum allowed value
 * @param max The maximum allowed value
 * @param decimalplaces Number of decimal places to round the value to
 * @param step The step size, starting from min, to which the value should be clamped
 * @param n The number to round and clamp
 * @param restrictToMarks Whether to restrict the value to the marks. Default is false.
 * @param marks Marks to restrict the value to. Default is undefined.
 * @returns The rounded and clamped value
 */
export function roundAndClampParameterValue(
	min: number,
	max: number,
	decimalplaces: number,
	step: number,
	n: number,
	restrictToMarks?: boolean,
	marks?: ParameterSliderMark[],
): number {
	// clamp the number to the min and max
	n = Math.max(min, n);
	n = Math.min(max, n);
	// if we must stick to marks, find the nearest mark within range and return it
	const validMarks =
		restrictToMarks && marks?.length
			? marks.filter((mark) => mark.value >= min && mark.value <= max)
			: undefined;
	if (restrictToMarks && validMarks?.length) {
		const closest = validMarks.reduce(
			(prev, current) =>
				Math.abs(current.value - n) < Math.abs(prev - n)
					? current.value
					: prev,
			validMarks[0].value,
		);
		return toFixedInRange(closest, min, max, decimalplaces);
	}
	// round the number to the nearest step
	n = Math.round((n - min) / step) * step + min;
	// rounding to the nearest step can result in a number larger than max, so we clamp again
	n = n > max ? n - step : n;
	return toFixedInRange(n, min, max, decimalplaces);
}

/**
 * Convert to a fixed point number with the given decimal places, staying
 * inside min and max. Rounding can leave the range if the decimal places
 * cannot represent min or max (e.g. overridden decimal places): the closest
 * representable value inside the range is used instead. If there is none,
 * the value is returned unrounded.
 */
export function toFixedInRange(
	n: number,
	min: number,
	max: number,
	decimalplaces: number,
): number {
	const rounded = +n.toFixed(decimalplaces);
	if (rounded >= min && rounded <= max) return rounded;
	const factor = Math.pow(10, decimalplaces);
	const inside =
		rounded < min
			? Math.ceil(+(min * factor).toFixed(8)) / factor
			: Math.floor(+(max * factor).toFixed(8)) / factor;
	return inside >= min && inside <= max ? +inside.toFixed(decimalplaces) : n;
}
