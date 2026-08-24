import {getParameterValuesInputSchema} from "../getParameterValues";

describe("getParameterValuesInputSchema", () => {
	it("accepts omitted namespace and optional names", () => {
		expect(getParameterValuesInputSchema.parse({})).toEqual({});
		expect(
			getParameterValuesInputSchema.parse({names: ["width"]}),
		).toEqual({names: ["width"]});
	});

	it("accepts optional namespace", () => {
		expect(
			getParameterValuesInputSchema.parse({namespace: "other"}),
		).toEqual({namespace: "other"});
		expect(
			getParameterValuesInputSchema.parse({
				names: ["width"],
				namespace: "c",
			}),
		).toEqual({names: ["width"], namespace: "c"});
	});

	it("rejects unknown keys", () => {
		expect(() =>
			getParameterValuesInputSchema.parse({filter: "visible"}),
		).toThrow();
	});
});
