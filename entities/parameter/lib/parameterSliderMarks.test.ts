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
			expect(getValidMarkValuesFromLib(testMarks, 2, 5)).toEqual([
				4.5,
			]);
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

		it("stays at the minimum mark when stepping down", () => {
			expect(
				getAdjacentMarkValueFromLib(1.5, testMarks, "down", 0, 10, 3),
			).toBe(1.5);
		});

		it("stays at the maximum mark when stepping up", () => {
			expect(
				getAdjacentMarkValueFromLib(9, testMarks, "up", 0, 10, 3),
			).toBe(
				9,
			);
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
	});
});
