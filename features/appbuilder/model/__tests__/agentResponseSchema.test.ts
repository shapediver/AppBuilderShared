import {zodResponseFormat} from "openai/helpers/zod";
import {z} from "zod";
import {
	AGENT_RESPONSE_FORMAT_NAME,
	AGENT_RESPONSE_SCHEMA,
	createAgentResponseFormat,
} from "../agentResponseSchema";

type ObjectJsonSchema = {
	type: string;
	properties?: Record<
		string,
		{
			type?: string;
			items?: Record<string, unknown>;
		}
	>;
	required?: string[];
};

function getObjectJsonSchema(responseFormat: {
	json_schema: {schema?: unknown};
}): ObjectJsonSchema {
	const schema = responseFormat.json_schema.schema;
	expect(schema).toEqual(expect.objectContaining({type: "object"}));

	return schema as ObjectJsonSchema;
}

describe("agent LLM response schema", () => {
	it("createAgentResponseFormat produces an object JSON Schema root (SS-9792)", () => {
		const responseFormat = createAgentResponseFormat();

		expect(responseFormat.type).toBe("json_schema");
		expect(responseFormat.json_schema.name).toBe(
			AGENT_RESPONSE_FORMAT_NAME,
		);
		expect(responseFormat.json_schema.strict).toBe(true);
		expect(getObjectJsonSchema(responseFormat).type).toBe("object");
	});

	it("keeps required agent response fields in the JSON Schema", () => {
		const schema = getObjectJsonSchema(createAgentResponseFormat());

		expect(schema.properties).toEqual(
			expect.objectContaining({
				parameterUpdates: expect.any(Object),
				summaryAndReasoning: expect.any(Object),
			}),
		);
		expect(schema.required).toEqual(
			expect.arrayContaining(["parameterUpdates", "summaryAndReasoning"]),
		);
	});

	it("uses anyOf (not oneOf) for parameter update variants in strict mode", () => {
		const schema = getObjectJsonSchema(createAgentResponseFormat());
		const items = schema.properties?.parameterUpdates?.items;

		expect(items).toHaveProperty("anyOf");
		expect(items).not.toHaveProperty("oneOf");
	});

	it("does not regress when zodResponseFormat is used directly with Zod v4", () => {
		const responseFormat = zodResponseFormat(
			AGENT_RESPONSE_SCHEMA,
			AGENT_RESPONSE_FORMAT_NAME,
		);
		const schema = getObjectJsonSchema(responseFormat);

		expect(schema.type).not.toBe("string");
		expect(schema.type).toBe("object");
	});
	it("round-trips a minimal valid agent response through the Zod schema", () => {
		const payload = {
			parameterUpdates: [
				{
					type: "String",
					id: "param-1",
					name: "Width",
					newValue: "120",
					oldValue: "100",
				},
			],
			summaryAndReasoning: "Increased shelf width.",
		};

		expect(AGENT_RESPONSE_SCHEMA.parse(payload)).toEqual(payload);
	});

	it("rejects malformed agent responses", () => {
		expect(() =>
			AGENT_RESPONSE_SCHEMA.parse({
				parameterUpdates: [],
			}),
		).toThrow();

		expect(() =>
			AGENT_RESPONSE_SCHEMA.parse({
				parameterUpdates: [],
				summaryAndReasoning: 123,
			}),
		).toThrow();
	});
});

describe("openai zod helper compatibility guard", () => {
	it("fails fast if openai helpers stop supporting Zod v4 object schemas", () => {
		const responseFormat = zodResponseFormat(
			z.object({value: z.string()}),
			"guard",
		);

		const schema = getObjectJsonSchema(responseFormat);

		expect(schema.type).toBe("object");
	});
});
