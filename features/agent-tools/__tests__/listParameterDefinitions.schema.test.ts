import {listParameterDefinitionsInputSchema} from "../config/listParameterDefinitions";

describe("listParameterDefinitionsInputSchema", () => {
	it("accepts empty object", () => {
		expect(listParameterDefinitionsInputSchema.parse({})).toEqual({});
	});

	it("rejects filter and sessionId", () => {
		expect(() =>
			listParameterDefinitionsInputSchema.parse({filter: "all"}),
		).toThrow();
		expect(() =>
			listParameterDefinitionsInputSchema.parse({sessionId: "s"}),
		).toThrow();
	});
});
