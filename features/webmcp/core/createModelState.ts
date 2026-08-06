import {createModelStateDataSchema} from "@AppBuilderLib/features/model-state/config/createModelState.zod";
import {z} from "@AppBuilderLib/shared/lib/zod";
import {ToolExecutionError, type ToolDef} from "./toolDefinition";

/** Tool input = hook data without `image` (agents don't set export screenshot refs). */
export const createModelStateInputSchema = createModelStateDataSchema.omit({
	image: true,
});

export const createModelStateOutputSchema = z.object({
	modelStateId: z.string(),
});

export type CreateModelStateOutput = z.infer<
	typeof createModelStateOutputSchema
>;

export const createModelStateTool: ToolDef<
	z.infer<typeof createModelStateInputSchema>,
	CreateModelStateOutput
> = {
	name: "create_model_state",
	description:
		"Create a unique identifier for the current state of the 3D configurator. " +
		"Optional includeImage, includeGltf, parameterNamesToInclude, parameterNamesToExclude, data. " +
		"Use includeImage:false when no preview screenshot is needed; includeGltf:true only when a GLTF export is required. " +
		"The returned modelStateId is required for import_model_state.",
	inputSchema: createModelStateInputSchema,
	outputSchema: createModelStateOutputSchema,
	annotations: {readOnlyHint: false, untrustedContentHint: true},
	execute: async (deps, parsed, _signal) => {
		const result = await deps.createModelState(parsed);
		if (!result.modelStateId) {
			throw new ToolExecutionError(
				"Error: Failed to create model state.\nRecovery: Retry create_model_state or check session readiness.",
				{
					success: false,
					error: "Failed to create model state.",
				},
			);
		}
		return {modelStateId: result.modelStateId};
	},
	format: (output) =>
		`Created model state ${output.modelStateId}. Use import_model_state with this modelStateId to restore it.`,
};
