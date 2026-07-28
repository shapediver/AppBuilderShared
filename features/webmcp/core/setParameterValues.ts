import {nameMessageSchema} from "@AppBuilderLib/features/model-state/config/importModelState.zod";
import {z} from "@AppBuilderLib/shared/lib/zod";
import {resolveAndUpdate} from "../lib/resolveSetParameterUpdates";
import {parameterValueSchema} from "./listParameterDefinitions";
import {ToolExecutionError, type ToolDef} from "./toolDefinition";

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

export const setParameterValuesOutputSchema = z.object({
	applied: z.array(z.string()),
	errors: z.array(nameMessageSchema),
});

function setParameterValuesContent(
	appliedCount: number,
	totalCount: number,
	errorCount: number,
): string {
	if (errorCount === 0) {
		return `Applied ${appliedCount} of ${totalCount} updates.`;
	}
	return `Applied ${appliedCount} of ${totalCount} updates. ${errorCount} failed.`;
}

export const setParameterValuesTool: ToolDef<
	z.infer<typeof setParameterValuesInputSchema>,
	SetParameterValuesOutput
> = {
	name: "set_parameter_values",
	description:
		"Set values of parameters, trigger execution, and wait for the 3D configurator to update. " +
		"Input uses updates [{ name, value, sessionId? }] — use the field `updates` and `name`, not `parameters` or `id`. " +
		"Read each parameter's `howto` from list_parameter_definitions for the exact value format per type (index vs label vs number vs color object). " +
		"Valid updates still apply when others fail. " +
		"If a user request is ambiguous (e.g. a value name that maps to multiple parameters, or a label that matches several choices across different parameters), ask the user to clarify which parameter and which choice before calling set_parameter_values. " +
		"For relative changes ('wider', 'larger', 'smaller'), read currentValue from list_parameter_definitions first and pick a moderate change; do not jump to min or max. " +
		"If two updates in one call target the same parameter with different values, detect the conflict and ask the user which one to apply instead of sending both.",
	inputSchema: setParameterValuesInputSchema,
	outputSchema: setParameterValuesOutputSchema,
	annotations: {readOnlyHint: false, untrustedContentHint: true},
	execute: async (deps, parsed, _signal) => {
		const result = await resolveAndUpdate(
			deps.namespace,
			deps.getLiveParameters,
			parsed.updates,
			deps.batchParameterValueUpdate,
		);
		const totalFailure =
			result.applied.length === 0 && result.errors.length > 0;
		const text = setParameterValuesContent(
			result.applied.length,
			parsed.updates.length,
			result.errors.length,
		);
		if (totalFailure) {
			throw new ToolExecutionError(text, {
				applied: result.applied,
				errors: result.errors,
			});
		}
		return result;
	},
	format: (output) =>
		setParameterValuesContent(
			output.applied.length,
			output.applied.length + output.errors.length,
			output.errors.length,
		),
};
