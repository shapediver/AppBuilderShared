import {setParameterValuesInputSchema} from "../../config/setParameterValues";
import {
	SET_PARAMETER_VALUES_TOOL_DESCRIPTION,
	SET_PARAMETER_VALUES_TOOL_NAME,
} from "../../config/tools";
import {formatToolInputError} from "../../lib/formatToolInputError";
import {resolveAndUpdate} from "../../lib/resolveSetParameterUpdates";
import type {ModelContext} from "../../lib/webmcpAvailability";
import {zodToJsonSchema} from "../../lib/zodToJsonSchema";
import type {WebMcpToolsDeps} from "../webMcpToolsDeps";

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
			execute: async (input) => {
				try {
					const parsed = setParameterValuesInputSchema.parse(input);

					return await resolveAndUpdate(
						deps.namespaceRef.current,
						deps.getLiveParameters,
						parsed.updates,
						deps.batchParameterValueUpdateRef.current,
					);
				} catch (e) {
					return {
						applied: [],
						...formatToolInputError(e),
					};
				}
			},
		},
		{signal},
	);
}
