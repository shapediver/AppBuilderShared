import {
	createFormExportParameterValue,
	mergeFormExportParameterValues,
} from "./mergeFormExportParameterValues";

describe("createFormExportParameterValue", () => {
	it("uses the parameter id rather than its display name as the export key", () => {
		const value = createFormExportParameterValue(
			"8c03f4ca-cc79-4f14-9a17-6ae1a1e5c1e1",
			"default",
			"default",
			"make it funny",
		);

		expect(value).toEqual({
			name: "8c03f4ca-cc79-4f14-9a17-6ae1a1e5c1e1",
			value: "make it funny",
		});
	});

	it("keeps a non-default parameter namespace", () => {
		expect(
			createFormExportParameterValue(
				"parameter-id",
				"other",
				"default",
				"value",
			),
		).toEqual({name: "parameter-id", sessionId: "other", value: "value"});
	});
});

describe("mergeFormExportParameterValues", () => {
	it("includes form values with their stable parameter ids", () => {
		expect(
			mergeFormExportParameterValues(undefined, [
				createFormExportParameterValue(
					"parameter-id",
					"default",
					"default",
					"make it funny",
				),
			]),
		).toEqual([
			{parameter: {name: "parameter-id"}, value: "make it funny"},
		]);
	});

	it("keeps export values that have no matching form field", () => {
		expect(
			mergeFormExportParameterValues(
				[{parameter: {name: "kept"}, value: "export"}],
				[
					createFormExportParameterValue(
						"added",
						"default",
						"default",
						"form",
					),
				],
			),
		).toEqual([
			{parameter: {name: "kept"}, value: "export"},
			{parameter: {name: "added"}, value: "form"},
		]);
	});

	it("overrides the matching export value at index 0 by parameter name", () => {
		expect(
			mergeFormExportParameterValues(
				[{parameter: {name: "parameter-id"}, value: "export"}],
				[
					createFormExportParameterValue(
						"parameter-id",
						"other",
						"default",
						"form",
					),
				],
			),
		).toEqual([
			{
				parameter: {name: "parameter-id", sessionId: "other"},
				value: "form",
			},
		]);
	});
});
