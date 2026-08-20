import {
	listParameterDefinitionsInputSchema,
	listParameterDefinitionsOutputSchema,
} from "@AppBuilderLib/features/agent-tools/config/listParameterDefinitions";
import {setParameterValuesInputSchema} from "@AppBuilderLib/features/agent-tools/config/setParameterValues";

describe("webmcp input schemas", () => {
	describe("listParameterDefinitionsInputSchema", () => {
		it("accepts empty object", () => {
			expect(listParameterDefinitionsInputSchema.parse({})).toEqual({});
		});

		it("rejects extra keys such as filter and visibleOnly", () => {
			expect(() =>
				listParameterDefinitionsInputSchema.parse({filter: "all"}),
			).toThrow();
			expect(() =>
				listParameterDefinitionsInputSchema.parse({visibleOnly: true}),
			).toThrow();
		});
	});

	describe("listParameterDefinitionsOutputSchema", () => {
		it("accepts parameters-only output", () => {
			expect(
				listParameterDefinitionsOutputSchema.parse({
					parameters: [
						{
							id: "width",
							name: "Width",
							type: "Int",
							settable: true,
						},
					],
				}),
			).toEqual({
				parameters: [
					{
						id: "width",
						name: "Width",
						type: "Int",
						settable: true,
					},
				],
			});
		});

		it("accepts optional errors array", () => {
			expect(
				listParameterDefinitionsOutputSchema.parse({
					parameters: [],
					errors: [{name: "*", message: "Invalid input"}],
				}),
			).toEqual({
				parameters: [],
				errors: [{name: "*", message: "Invalid input"}],
			});
		});
	});

	describe("setParameterValuesInputSchema", () => {
		it("accepts valid updates", () => {
			expect(
				setParameterValuesInputSchema.parse({
					updates: [
						{name: "Width", value: 10},
						{
							name: "Color",
							value: {red: 255, green: 0, blue: 0, alpha: 255},
						},
					],
				}),
			).toEqual({
				updates: [
					{name: "Width", value: 10},
					{
						name: "Color",
						value: {red: 255, green: 0, blue: 0, alpha: 255},
					},
				],
			});
		});

		it("rejects missing updates array", () => {
			expect(() => setParameterValuesInputSchema.parse({})).toThrow();
		});
	});
});
