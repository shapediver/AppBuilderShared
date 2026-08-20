import {z} from "@AppBuilderLib/shared/lib/zod";
import {zodToJsonSchema} from "../lib/zodToJsonSchema";

describe("zodToJsonSchema", () => {
	it("converts object schema with optional fields, arrays, enums, unions, and records", () => {
		const colorSchema = z.object({
			red: z.number(),
			green: z.number(),
			blue: z.number(),
			alpha: z.number(),
		});

		const schema = z.object({
			name: z.string(),
			count: z.number().optional(),
			enabled: z.boolean(),
			filter: z.enum(["all", "visible"]),
			value: z.union([z.string(), z.number(), z.boolean(), colorSchema]),
			tags: z.array(z.string()),
			metadata: z.record(z.string(), z.any()),
		});

		const jsonSchema = zodToJsonSchema(schema);

		expect(jsonSchema).toEqual({
			type: "object",
			properties: {
				name: {type: "string"},
				count: {type: "number"},
				enabled: {type: "boolean"},
				filter: {type: "string", enum: ["all", "visible"]},
				value: {
					anyOf: [
						{type: "string"},
						{type: "number"},
						{type: "boolean"},
						{
							type: "object",
							properties: {
								red: {type: "number"},
								green: {type: "number"},
								blue: {type: "number"},
								alpha: {type: "number"},
							},
							required: ["red", "green", "blue", "alpha"],
							additionalProperties: false,
						},
					],
				},
				tags: {
					type: "array",
					items: {type: "string"},
				},
				metadata: {
					type: "object",
					additionalProperties: {},
				},
			},
			required: [
				"name",
				"enabled",
				"filter",
				"value",
				"tags",
				"metadata",
			],
			additionalProperties: false,
		});
	});

	it("converts literal schemas", () => {
		expect(zodToJsonSchema(z.literal(true))).toEqual({
			type: "boolean",
			const: true,
		});
	});
});
