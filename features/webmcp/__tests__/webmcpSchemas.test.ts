import {ZodError} from "@AppBuilderLib/shared/lib/zod";
import {createModelStateInputSchema} from "../config/createModelState";
import {
	importModelStateInputSchema,
	importModelStateSuccessOutputSchema,
} from "../config/importModelState";
import {setParameterValuesInputSchema} from "../config/setParameterValues";
import {
	listParameterDefinitionsInputSchema,
	listParameterDefinitionsOutputSchema,
} from "../core/listParameterDefinitions";
import {
	listSessionsInputSchema,
	listSessionsOutputSchema,
} from "../core/listSessions";
import {
	runTool,
	toolError,
	toolSuccess,
	toolZodError,
} from "../lib/toolResponse";

describe("webmcp input schemas", () => {
	describe("listSessionsInputSchema", () => {
		it("accepts empty object", () => {
			expect(listSessionsInputSchema.parse({})).toEqual({});
		});

		it("rejects unknown keys", () => {
			expect(() =>
				listSessionsInputSchema.parse({sessionId: "x"}),
			).toThrow();
		});
	});

	describe("listSessionsOutputSchema", () => {
		it("accepts structured sessions output", () => {
			expect(
				listSessionsOutputSchema.parse({
					sessions: [{sessionId: "session-1"}],
				}),
			).toEqual({
				sessions: [{sessionId: "session-1"}],
			});
		});
	});

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

		it("accepts search and limit", () => {
			expect(
				listParameterDefinitionsInputSchema.parse({
					search: "width",
					limit: 5,
				}),
			).toEqual({
				search: "width",
				limit: 5,
			});
		});

		it("rejects non-positive limit", () => {
			expect(() =>
				listParameterDefinitionsInputSchema.parse({limit: 0}),
			).toThrow();
			expect(() =>
				listParameterDefinitionsInputSchema.parse({limit: -1}),
			).toThrow();
		});

		it("rejects non-integer limit", () => {
			expect(() =>
				listParameterDefinitionsInputSchema.parse({limit: 1.5}),
			).toThrow();
		});

		it("rejects limit > 100", () => {
			expect(() =>
				listParameterDefinitionsInputSchema.parse({limit: 101}),
			).toThrow();
		});

		it("accepts offset 0 and positive offset", () => {
			expect(
				listParameterDefinitionsInputSchema.parse({offset: 0}),
			).toEqual({offset: 0});
			expect(
				listParameterDefinitionsInputSchema.parse({offset: 40}),
			).toEqual({offset: 40});
		});

		it("accepts offset with limit for pagination", () => {
			expect(
				listParameterDefinitionsInputSchema.parse({
					limit: 20,
					offset: 20,
				}),
			).toEqual({limit: 20, offset: 20});
		});

		it("rejects negative offset", () => {
			expect(() =>
				listParameterDefinitionsInputSchema.parse({offset: -1}),
			).toThrow();
		});

		it("rejects non-integer offset", () => {
			expect(() =>
				listParameterDefinitionsInputSchema.parse({offset: 1.5}),
			).toThrow();
		});
	});

	describe("listParameterDefinitionsOutputSchema", () => {
		it("accepts structured parameters output with sessionCount and offset", () => {
			expect(
				listParameterDefinitionsOutputSchema.parse({
					parameters: [
						{
							id: "width",
							sessionId: "session-1",
							name: "Width",
							type: "Int",
							howto: "Use a number in range [0, 10].",
							settable: true,
						},
					],
					sessionCount: 1,
					offset: 0,
				}),
			).toEqual({
				parameters: [
					{
						id: "width",
						sessionId: "session-1",
						name: "Width",
						type: "Int",
						howto: "Use a number in range [0, 10].",
						settable: true,
					},
				],
				sessionCount: 1,
				offset: 0,
			});
		});

		it("accepts truncated page with remaining and nextOffset", () => {
			expect(
				listParameterDefinitionsOutputSchema.parse({
					parameters: [
						{
							id: "width",
							sessionId: "session-1",
							name: "Width",
							type: "Int",
							howto: "Use a number in range [0, 10].",
							settable: true,
						},
					],
					truncated: true,
					sessionCount: 1,
					offset: 0,
					remaining: 3,
					nextOffset: 1,
				}),
			).toMatchObject({
				truncated: true,
				remaining: 3,
				nextOffset: 1,
			});
		});
	});

	describe("toolResponse helpers", () => {
		it("toolSuccess builds content + structuredContent", () => {
			expect(toolSuccess("ok", {foo: 1})).toEqual({
				content: [{type: "text", text: "ok"}],
				structuredContent: {foo: 1},
			});
		});

		it("toolError sets isError", () => {
			expect(toolError("Error: boom\nRecovery: retry")).toEqual({
				content: [{type: "text", text: "Error: boom\nRecovery: retry"}],
				isError: true,
			});
		});

		it("toolZodError keeps issues as object, not stringified", () => {
			let zodError: ZodError;
			try {
				listParameterDefinitionsInputSchema.parse({filter: "hidden"});
				throw new Error("expected parse to throw");
			} catch (e) {
				zodError = e as ZodError;
			}

			const result = toolZodError(zodError);
			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("Invalid input data");
			expect(result.content[0].text).toContain("Recovery: Fix filter");
			expect(Array.isArray(result.structuredContent?.error)).toBe(true);
			expect(typeof result.structuredContent?.error === "string").toBe(
				false,
			);
		});

		it("runTool separates zod parse errors from execution errors", async () => {
			const zodResult = await runTool(
				listParameterDefinitionsInputSchema,
				{visibleOnly: true},
				() => toolSuccess("should not run"),
			);
			expect(zodResult.isError).toBe(true);
			expect(zodResult.content[0].text).toContain("Invalid input data");

			const execResult = await runTool(
				listParameterDefinitionsInputSchema,
				{},
				() => {
					throw new Error("runtime failed");
				},
			);
			expect(execResult.isError).toBe(true);
			expect(execResult.content[0].text).toContain("runtime failed");
			expect(execResult.content[0].text).toContain("Recovery:");
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

	describe("importModelStateSuccessOutputSchema", () => {
		it("accepts success output with optional invalidParameters", () => {
			expect(
				importModelStateSuccessOutputSchema.parse({
					success: true,
					appliedParameterIds: ["width"],
					invalidParameters: [
						{
							name: "unknown",
							message:
								'Parameter "unknown" does not exist in the current model session.',
						},
					],
				}),
			).toEqual({
				success: true,
				appliedParameterIds: ["width"],
				invalidParameters: [
					{
						name: "unknown",
						message:
							'Parameter "unknown" does not exist in the current model session.',
					},
				],
			});
		});

		it("accepts empty appliedParameterIds", () => {
			expect(
				importModelStateSuccessOutputSchema.parse({
					success: true,
					appliedParameterIds: [],
				}),
			).toEqual({
				success: true,
				appliedParameterIds: [],
			});
		});
	});
});
