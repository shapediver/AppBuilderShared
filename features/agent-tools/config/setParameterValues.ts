import {nameMessageSchema} from "@AppBuilderLib/features/model-state/config/importModelState.zod";
import {z} from "@AppBuilderLib/shared/lib/zod";
import {parameterValueSchema} from "./listParameterDefinitions";

const setParameterUpdateSchema = z.strictObject({
	name: z
		.string()
		.describe(
			"Parameter id, internal name, or display name from list_parameter_definitions.",
		),
	sessionId: z
		.string()
		.optional()
		.describe("Optional session namespace. Omit for the main model."),
	value: parameterValueSchema.describe(
		"New value. StringList: 0-based integer index (e.g. 1 for second choice), not the label text and not {index:N}.",
	),
});

export const setParameterValuesInputSchema = z.strictObject({
	updates: z
		.array(setParameterUpdateSchema)
		.describe(
			"Required array of changes. Use this field name exactly — not parameters or ids.",
		),
});

export type ParameterUpdateInput = z.infer<typeof setParameterUpdateSchema>;
export type SetParameterValuesError = z.infer<typeof nameMessageSchema>;
export type SetParameterValuesOutput = {
	applied: string[];
	errors: SetParameterValuesError[];
};
