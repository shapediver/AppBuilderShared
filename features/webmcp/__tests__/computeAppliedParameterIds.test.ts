import {computeAppliedParameterIds} from "../lib/computeAppliedParameterIds";

describe("computeAppliedParameterIds", () => {
	it("returns ids whose uiValue changed", () => {
		const beforeValues = new Map<string, unknown>([
			["width", 10],
			["height", 20],
			["depth", 5],
		]);

		const applied = computeAppliedParameterIds(beforeValues, [
			{definition: {id: "width"}, state: {uiValue: 42}},
			{definition: {id: "height"}, state: {uiValue: 20}},
			{definition: {id: "depth"}, state: {uiValue: 8}},
		]);

		expect(applied).toEqual(["width", "depth"]);
	});

	it("returns empty array when no values changed", () => {
		const beforeValues = new Map<string, unknown>([
			["width", 10],
			["height", 20],
		]);

		const applied = computeAppliedParameterIds(beforeValues, [
			{definition: {id: "width"}, state: {uiValue: 10}},
			{definition: {id: "height"}, state: {uiValue: 20}},
		]);

		expect(applied).toEqual([]);
	});

	it("treats missing before snapshot as a change", () => {
		const beforeValues = new Map<string, unknown>();

		const applied = computeAppliedParameterIds(beforeValues, [
			{definition: {id: "width"}, state: {uiValue: 10}},
		]);

		expect(applied).toEqual(["width"]);
	});
});
