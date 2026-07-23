import {createModelStateInputSchema} from "../../config/createModelState";
import {
	CREATE_MODEL_STATE_TOOL_DESCRIPTION,
	CREATE_MODEL_STATE_TOOL_NAME,
} from "../../config/tools";
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
			execute: async (input) => {
				try {
					const parsed = createModelStateInputSchema.parse(input);
					const result =
						await deps.createModelStateRef.current(parsed);

					if (!result.modelStateId) {
						return {
							success: false as const,
							error: "Failed to create model state.",
						};
					}

					return {
						success: true as const,
						modelStateId: result.modelStateId,
						modelStateImageUrl: result.modelStateImageUrl,
						modelStateGltfUrl: result.modelStateGltfUrl,
						modelStateUsdzUrl: result.modelStateUsdzUrl,
						modelViewUrl: result.modelViewUrl ?? "",
					};
				} catch (e) {
					return {
						success: false as const,
						error: e instanceof Error ? e.message : String(e),
					};
				}
			},
		},
		{signal},
	);
}
