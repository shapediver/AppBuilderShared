import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import {zodResponseFormat} from "openai/helpers/zod";
import {z} from "zod";

export const AGENT_RESPONSE_FORMAT_NAME = "parameters_update";

/**
 * Schema for responses from the LLM.
 * Uses z.union (anyOf in JSON Schema), not z.discriminatedUnion (oneOf),
 * because OpenAI structured outputs reject oneOf in strict mode.
 * https://platform.openai.com/docs/guides/structured-outputs#supported-schemas
 */
const scalarParameterUpdateSchema = z.object({
	type: z
		.enum([
			ResParameterType.BOOL,
			ResParameterType.EVEN,
			ResParameterType.FLOAT,
			ResParameterType.INT,
			ResParameterType.ODD,
			ResParameterType.STRING,
		])
		.describe("The type of the parameter to be updated"),
	id: z.string().describe("The id of the parameter to be updated"),
	name: z.string().describe("The name of the parameter to be updated"),
	newValue: z.string().describe("The new value for the parameter"),
	oldValue: z.string().describe("The old value for the parameter"),
});

const stringListParameterUpdateSchema = z.object({
	type: z
		.literal(ResParameterType.STRINGLIST)
		.describe("The StringList parameter type"),
	id: z.string().describe("The id of the StringList parameter to be updated"),
	name: z
		.string()
		.describe("The name of the StringList parameter to be updated"),
	newIndex: z
		.string()
		.describe("The new 0-based index into the list of options"),
	oldIndex: z.string().describe("The old index into the list of options"),
});

const colorChannelsSchema = z.object({
	red: z.number().describe("The red channel value between 0 and 255"),
	green: z.number().describe("The green channel value between 0 and 255"),
	blue: z.number().describe("The blue channel value between 0 and 255"),
	alpha: z.number().describe("The alpha channel value between 0 and 255"),
});

const colorParameterUpdateSchema = z.object({
	type: z
		.literal(ResParameterType.COLOR)
		.describe("The Color parameter type"),
	id: z.string().describe("The id of the Color parameter to be updated"),
	name: z.string().describe("The name of the Color parameter to be updated"),
	newValue: colorChannelsSchema.describe("The new color value"),
	oldValue: colorChannelsSchema.describe("The old color value"),
});

export const AGENT_RESPONSE_SCHEMA = z.object({
	parameterUpdates: z
		.array(
			z.union([
				scalarParameterUpdateSchema,
				stringListParameterUpdateSchema,
				colorParameterUpdateSchema,
			]),
		)
		.describe("Array of parameters to update"),
	summaryAndReasoning: z
		.string()
		.describe(
			"A summary of the parameter updates and the reasoning behind the parameter updates, and answers to the user's questions.",
		),
});

export type AgentResponseType = z.infer<typeof AGENT_RESPONSE_SCHEMA>;

export function createAgentResponseFormat() {
	return zodResponseFormat(AGENT_RESPONSE_SCHEMA, AGENT_RESPONSE_FORMAT_NAME);
}
