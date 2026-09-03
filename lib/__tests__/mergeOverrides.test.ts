import {applyOverrides} from "../mergeOverrides";

describe("applyOverrides settings.resettable", () => {
	it("merges overrides.settings.resettable onto definition.settings", () => {
		const result = applyOverrides(
			{id: "p1", settings: {step: 0.1}},
			{settings: {resettable: true}},
		);
		expect(result.settings).toEqual({step: 0.1, resettable: true});
		expect(result.resettable).toBeUndefined();
	});

	it("sets settings when definition has none", () => {
		const result = applyOverrides(
			{id: "p1"},
			{settings: {resettable: true}},
		);
		expect(result.settings).toEqual({resettable: true});
	});
});
