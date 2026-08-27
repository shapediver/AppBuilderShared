import {
	getAdjacentMarkValue as getAdjacentMarkValueFromLib,
	getValidMarkValues as getValidMarkValuesFromLib,
	roundAndClampParameterValue,
} from "./parameterSliderMarks";

const testMarks = [{value: 1.5}, {value: 4.5}, {value: 9}];

describe("parameterSliderMarks", () => {
	describe("getValidMarkValues", () => {
		it("filters and sorts marks in range", () => {
			expect(getValidMarkValuesFromLib(testMarks, 0, 10)).toEqual([
				1.5, 4.5, 9,
			]);
			expect(getValidMarkValuesFromLib(testMarks, 2, 5)).toEqual([4.5]);
		});

		it("includes marks on the range endpoints", () => {
			expect(
				getValidMarkValuesFromLib([{value: 0}, {value: 10}], 0, 10),
			).toEqual([0, 10]);
		});

		it("sorts unique values", () => {
			expect(
				getValidMarkValuesFromLib(
					[{value: 9}, {value: 1.5}, {value: 4.5}, {value: 1.5}],
					0,
					10,
				),
			).toEqual([1.5, 4.5, 9]);
		});
	});

	describe("getAdjacentMarkValue", () => {
		it("steps up to the next mark from an exact mark value", () => {
			expect(
				getAdjacentMarkValueFromLib(1.5, testMarks, "up", 0, 10, 3),
			).toBe(4.5);
		});

		it("steps up from a value between marks to the next mark above", () => {
			expect(
				getAdjacentMarkValueFromLib(1.501, testMarks, "up", 0, 10, 3),
			).toBe(4.5);
		});

		it("steps down to the previous mark", () => {
			expect(
				getAdjacentMarkValueFromLib(4.5, testMarks, "down", 0, 10, 3),
			).toBe(1.5);
		});

		it("steps down from a value between marks to the mark below", () => {
			expect(
				getAdjacentMarkValueFromLib(3, testMarks, "down", 0, 10, 3),
			).toBe(1.5);
		});

		it("stays at the minimum mark when stepping down", () => {
			expect(
				getAdjacentMarkValueFromLib(1.5, testMarks, "down", 0, 10, 3),
			).toBe(1.5);
		});

		it("stays at the maximum mark when stepping up", () => {
			expect(
				getAdjacentMarkValueFromLib(9, testMarks, "up", 0, 10, 3),
			).toBe(9);
		});

		it("rounds the current value when there are no marks in range", () => {
			expect(
				getAdjacentMarkValueFromLib(1.234, [], "up", 0, 10, 2),
			).toBe(1.23);
		});

		it("snaps to the only in-range mark", () => {
			expect(
				getAdjacentMarkValueFromLib(
					3,
					[{value: 4.5}],
					"up",
					0,
					10,
					3,
				),
			).toBe(4.5);
		});

		it("steps up to the last mark from above every mark", () => {
			expect(
				getAdjacentMarkValueFromLib(9.5, testMarks, "up", 0, 10, 3),
			).toBe(9);
		});

		it("steps down to the first mark from below every mark", () => {
			expect(
				getAdjacentMarkValueFromLib(0.1, testMarks, "down", 0, 10, 3),
			).toBe(1.5);
		});

		it("treats a value within rounding tolerance as the nearby mark when stepping up", () => {
			expect(
				getAdjacentMarkValueFromLib(4.4996, testMarks, "up", 0, 10, 3),
			).toBe(9);
		});

		it("treats a value within rounding tolerance as the nearby mark when stepping down", () => {
			expect(
				getAdjacentMarkValueFromLib(4.5004, testMarks, "down", 0, 10, 3),
			).toBe(1.5);
		});

		it("does not treat a value outside rounding tolerance as an exact mark", () => {
			expect(
				getAdjacentMarkValueFromLib(4.5007, testMarks, "down", 0, 10, 3),
			).toBe(4.5);
		});

		it("treats a value on the rounding-tolerance boundary as an exact mark", () => {
			expect(
				getAdjacentMarkValueFromLib(
					5.5,
					[{value: 2}, {value: 5}, {value: 8}],
					"down",
					0,
					10,
					0,
				),
			).toBe(2);
		});
	});

	describe("roundAndClampParameterValue", () => {
		it("snaps to the nearest mark when restrictToMarks is true", () => {
			expect(
				roundAndClampParameterValue(
					0,
					10,
					3,
					0.001,
					1.501,
					true,
					testMarks,
				),
			).toBe(1.5);
		});

		it("snaps to the farther mark when it is closer", () => {
			expect(
				roundAndClampParameterValue(0, 10, 3, 1, 7, true, testMarks),
			).toBe(9);
		});

		it("keeps the earlier mark on a distance tie", () => {
			expect(
				roundAndClampParameterValue(0, 10, 1, 1, 3, true, [
					{value: 1.5},
					{value: 4.5},
				]),
			).toBe(1.5);
		});

		it("includes marks on the min and max endpoints", () => {
			const ends = [{value: 0}, {value: 10}];
			expect(
				roundAndClampParameterValue(0, 10, 0, 1, 0.1, true, ends),
			).toBe(0);
			expect(
				roundAndClampParameterValue(0, 10, 0, 1, 9.9, true, ends),
			).toBe(10);
		});

		it("ignores marks outside the range", () => {
			expect(
				roundAndClampParameterValue(0, 10, 1, 1, 10, true, [
					{value: 1.5},
					{value: 15},
				]),
			).toBe(1.5);
			expect(
				roundAndClampParameterValue(0, 10, 1, 1, 0, true, [
					{value: -1},
					{value: 10},
				]),
			).toBe(10);
		});

		it("rounds to step when restrictToMarks is false", () => {
			expect(
				roundAndClampParameterValue(0, 10, 0, 1, 3.6, false, testMarks),
			).toBe(4);
			expect(roundAndClampParameterValue(2, 10, 0, 1, 3.6)).toBe(4);
		});

		it("rounds to step when restrictToMarks is true but marks are missing", () => {
			expect(roundAndClampParameterValue(0, 10, 0, 1, 3.2, true)).toBe(3);
			expect(
				roundAndClampParameterValue(0, 10, 0, 1, 3.2, true, []),
			).toBe(3);
		});

		it("clamps below min and above max before rounding", () => {
			expect(roundAndClampParameterValue(0, 10, 0, 1, -2)).toBe(0);
			expect(roundAndClampParameterValue(0, 10, 0, 1, 15)).toBe(10);
		});

		it("steps back when rounding overshoots max", () => {
			expect(roundAndClampParameterValue(0, 10, 0, 6, 10)).toBe(6);
		});
	});
});
