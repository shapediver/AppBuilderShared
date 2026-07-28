import {getParameterStates} from "@AppBuilderLib/entities/parameter/lib/parameterStates";
import {
	importModelStateDataSchema,
	nameMessageSchema,
} from "@AppBuilderLib/features/model-state/config/importModelState.zod";
import {z} from "@AppBuilderLib/shared/lib/zod";
import {computeAppliedParameterIds} from "../lib/computeAppliedParameterIds";
import {ToolExecutionError, type ToolDef} from "./toolDefinition";

export const importModelStateInputSchema = importModelStateDataSchema;

export const importModelStateOutputSchema = z.object({
	success: z.literal(true),
	appliedParameterIds: z.array(z.string()),
	invalidParameters: z.array(nameMessageSchema).optional(),
});

/** @deprecated alias kept for existing test name */
export const importModelStateSuccessOutputSchema = importModelStateOutputSchema;

export type ImportModelStateOutput = z.infer<
	typeof importModelStateOutputSchema
>;

export const importModelStateTool: ToolDef<
	z.infer<typeof importModelStateInputSchema>,
	ImportModelStateOutput
> = {
	name: "import_model_state",
	description:
		"Load configurator state from a modelStateId and wait for the update to complete. " +
		"Input: { modelStateId } from create_model_state (or URL containing modelStateId). " +
		"Use list_parameter_definitions after import to verify currentValue.",
	inputSchema: importModelStateInputSchema,
	outputSchema: importModelStateOutputSchema,
	annotations: {readOnlyHint: false, untrustedContentHint: true},
	execute: async (deps, parsed, _signal) => {
		const targetNamespace = deps.namespace;
		const beforeValues = new Map(
			getParameterStates(targetNamespace).map((p) => [
				p.definition.id,
				p.state.uiValue,
			]),
		);
		const result = await deps.importModelState(parsed);

		if (!result.success) {
			throw new ToolExecutionError(
				`Error: ${result.message}\nRecovery: Verify modelStateId with create_model_state or list_parameter_definitions after a valid import.`,
				{
					success: false,
					message: result.message,
					invalidParameters: result.invalidParameters ?? [],
				},
			);
		}

		const appliedParameterIds = computeAppliedParameterIds(
			beforeValues,
			getParameterStates(targetNamespace),
		);

		return {
			success: true as const,
			appliedParameterIds,
			...(result.invalidParameters
				? {invalidParameters: result.invalidParameters}
				: {}),
		};
	},
	format: (output) => {
		const invalidCount = output.invalidParameters?.length ?? 0;
		return invalidCount > 0
			? `Imported model state. Applied ${output.appliedParameterIds.length} parameter(s); ${invalidCount} invalid.`
			: `Imported model state. Applied ${output.appliedParameterIds.length} parameter(s).`;
	},
};
