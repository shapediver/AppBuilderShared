import {computeAppliedParameterIds} from "../computeAppliedParameterIds";

describe("computeAppliedParameterIds", () => {
	it("returns ids whose execValue changed", () => {
		const beforeValues = new Map<string, unknown>([
			["width", 10],
			["height", 20],
			["depth", 5],
		]);

		const applied = computeAppliedParameterIds(beforeValues, [
			{definition: {id: "width"}, state: {execValue: 42}},
			{definition: {id: "height"}, state: {execValue: 20}},
			{definition: {id: "depth"}, state: {execValue: 8}},
		]);

		expect(applied).toEqual(["width", "depth"]);
	});

	it("returns empty array when no values changed", () => {
		const beforeValues = new Map<string, unknown>([
			["width", 10],
			["height", 20],
		]);

		const applied = computeAppliedParameterIds(beforeValues, [
			{definition: {id: "width"}, state: {execValue: 10}},
			{definition: {id: "height"}, state: {execValue: 20}},
		]);

		expect(applied).toEqual([]);
	});

	it("treats missing before snapshot as a change", () => {
		const beforeValues = new Map<string, unknown>();

		const applied = computeAppliedParameterIds(beforeValues, [
			{definition: {id: "width"}, state: {execValue: 10}},
		]);

		expect(applied).toEqual(["width"]);
	});

	it("detects an executed change when ui would look unchanged after reset", () => {
		const beforeValues = new Map<string, unknown>([["add", ""]]);

		const applied = computeAppliedParameterIds(beforeValues, [
			{definition: {id: "add"}, state: {execValue: "DoorHandle"}},
		]);

		expect(applied).toEqual(["add"]);
	});
});
