import {setParameterValuesInputSchema} from "../../config/setParameterValues";
import {
	SET_PARAMETER_VALUES_TOOL_DESCRIPTION,
	SET_PARAMETER_VALUES_TOOL_NAME,
} from "../../config/tools";
import {resolveAndUpdate} from "../../lib/resolveSetParameterUpdates";
import {runTool, toolError, toolSuccess} from "../../lib/toolResponse";
import type {ModelContext} from "../../lib/webmcpAvailability";
import {zodToJsonSchema} from "../../lib/zodToJsonSchema";
import type {WebMcpToolsDeps} from "../webMcpToolsDeps";

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

export async function registerSetParameterValuesTool(
	modelContext: ModelContext,
	deps: WebMcpToolsDeps,
	signal: AbortSignal,
): Promise<void> {
	await modelContext.registerTool(
		{
			name: SET_PARAMETER_VALUES_TOOL_NAME,
			description: SET_PARAMETER_VALUES_TOOL_DESCRIPTION,
			inputSchema: zodToJsonSchema(setParameterValuesInputSchema),
			annotations: {
				readOnlyHint: false,
				untrustedContentHint: true,
			},
			execute: async (input) =>
				runTool(
					setParameterValuesInputSchema,
					input,
					async (parsed) => {
						const result = await resolveAndUpdate(
							deps.namespaceRef.current,
							deps.getLiveParameters,
							parsed.updates,
							deps.batchParameterValueUpdateRef.current,
						);
						const totalFailure =
							result.applied.length === 0 &&
							result.errors.length > 0;
						const text = setParameterValuesContent(
							result.applied.length,
							parsed.updates.length,
							result.errors.length,
						);
						const response = totalFailure
							? toolError(text, {
									applied: result.applied,
									errors: result.errors,
								})
							: toolSuccess(text, {
									applied: result.applied,
									errors: result.errors,
								});
						return response;
					},
				),
		},
		{signal},
	);
}
