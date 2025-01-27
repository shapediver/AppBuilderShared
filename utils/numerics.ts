/**
 * Round the given value to the nearest bracket.
 * @param value Value to round
 * @param interval Interval between brackets.
 * @returns
 */
export function roundToBracket(
	value: number,
	interval: number | undefined,
): number {
	const _interval = interval ?? 100;

	return Math.ceil(value / _interval) * _interval;
}
