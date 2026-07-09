import {createModelStateInputSchema} from "../config/createModelState";
import {importModelStateInputSchema} from "../config/importModelState";
import {listParameterDefinitionsInputSchema} from "../config/listParameterDefinitions";
import {setParameterValuesInputSchema} from "../config/setParameterValues";

describe("webmcp input schemas", () => {
	describe("listParameterDefinitionsInputSchema", () => {
		it("accepts valid input", () => {
			expect(
				listParameterDefinitionsInputSchema.parse({
					filter: "visible",
					sessionId: "session-1",
				}),
			).toEqual({
				filter: "visible",
				sessionId: "session-1",
			});
		});

		it("accepts empty object with defaults implied at runtime", () => {
			expect(listParameterDefinitionsInputSchema.parse({})).toEqual({});
		});

		it("rejects invalid filter enum", () => {
			expect(() =>
				listParameterDefinitionsInputSchema.parse({filter: "hidden"}),
			).toThrow();
		});

		it("rejects unknown keys such as visibleOnly", () => {
			expect(() =>
				listParameterDefinitionsInputSchema.parse({visibleOnly: true}),
			).toThrow();
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

	describe("createModelStateInputSchema", () => {
		it("accepts optional fields", () => {
			expect(
				createModelStateInputSchema.parse({
					includeImage: true,
					includeGltf: false,
					data: {foo: "bar"},
				}),
			).toEqual({
				includeImage: true,
				includeGltf: false,
				data: {foo: "bar"},
			});
		});

		it("rejects non-object input", () => {
			expect(() => createModelStateInputSchema.parse("bad")).toThrow();
		});
	});

	describe("importModelStateInputSchema", () => {
		it("accepts modelStateId", () => {
			expect(
				importModelStateInputSchema.parse({
					modelStateId: "abc-123",
				}),
			).toEqual({modelStateId: "abc-123"});
		});

		it("rejects missing modelStateId", () => {
			expect(() => importModelStateInputSchema.parse({})).toThrow();
		});
	});
});
