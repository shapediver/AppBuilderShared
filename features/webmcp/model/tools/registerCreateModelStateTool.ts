import {createModelStateInputSchema} from "../../core/createModelState";
import {
	CREATE_MODEL_STATE_TOOL_DESCRIPTION,
	CREATE_MODEL_STATE_TOOL_NAME,
} from "../../core/tools";
import {runTool, toolError, toolSuccess} from "../../lib/toolResponse";
import type {ModelContext} from "../../lib/webmcpAvailability";
import {zodToJsonSchema} from "../../lib/zodToJsonSchema";
import type {WebMcpToolsDeps} from "../webMcpToolsDeps";

export async function registerCreateModelStateTool(
	modelContext: ModelContext,
	deps: WebMcpToolsDeps,
	signal: AbortSignal,
): Promise<void> {
	await modelContext.registerTool(
		{
			name: CREATE_MODEL_STATE_TOOL_NAME,
			description: CREATE_MODEL_STATE_TOOL_DESCRIPTION,
			inputSchema: zodToJsonSchema(createModelStateInputSchema),
			annotations: {
				readOnlyHint: false,
				untrustedContentHint: true,
			},
			execute: async (input) =>
				runTool(createModelStateInputSchema, input, async (parsed) => {
					const result =
						await deps.createModelStateRef.current(parsed);

					if (!result.modelStateId) {
						return toolError(
							"Error: Failed to create model state.\nRecovery: Retry create_model_state or check session readiness.",
							{
								success: false,
								error: "Failed to create model state.",
							},
						);
					}

					const structuredContent = {
						success: true as const,
						modelStateId: result.modelStateId,
						modelStateImageUrl: result.modelStateImageUrl,
						modelStateGltfUrl: result.modelStateGltfUrl,
						modelStateUsdzUrl: result.modelStateUsdzUrl,
						modelViewUrl: result.modelViewUrl ?? "",
					};

					return toolSuccess(
						`Created model state ${result.modelStateId}. Use import_model_state with this modelStateId to restore it.`,
						structuredContent,
					);
				}),
		},
		{signal},
	);
}
