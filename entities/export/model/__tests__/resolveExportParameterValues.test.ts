const resolveParameterValueSources = jest.fn();

jest.mock(
	"@AppBuilderLib/entities/parameter/lib/resolveParameterValueSources",
	() => ({
		resolveParameterValueSources: (...args: unknown[]) =>
			resolveParameterValueSources(...args),
	}),
);

import {resolveExportParameterValues} from "../resolveExportParameterValues";

const source = {type: "dataOutput", props: {name: "Label"}} as never;

describe("resolveExportParameterValues", () => {
	beforeEach(() => resolveParameterValueSources.mockReset());

	it("returns undefined without parameter values", async () => {
		await expect(
			resolveExportParameterValues(undefined, "controller"),
		).resolves.toBeUndefined();
		expect(resolveParameterValueSources).not.toHaveBeenCalled();
	});

	it("passes literal values without resolving sources", async () => {
		await expect(
			resolveExportParameterValues(
				[{parameter: {name: "Length"}, value: "180"}],
				"controller",
			),
		).resolves.toEqual({Length: "180"});
		expect(resolveParameterValueSources).not.toHaveBeenCalled();
	});

	it("resolves sources in the parameter's session and keeps results aligned", async () => {
		resolveParameterValueSources.mockResolvedValue(["", "file-id"]);
		await expect(
			resolveExportParameterValues(
				[
					{parameter: {name: "A"}, value: "a", source},
					{parameter: {name: "B"}, source},
					{parameter: {name: "C", sessionId: "table"}, source},
				],
				"controller",
			),
		).resolves.toEqual({A: "a", C: "file-id"});
		expect(resolveParameterValueSources).toHaveBeenCalledWith(
			[
				{id: "B", value: source, namespace: undefined},
				{id: "C", value: source, namespace: "table"},
			],
			{namespace: "controller"},
		);
	});
});
