import {getParameterStates} from "@AppBuilderLib/entities/parameter/lib/parameterStates";
import {
	IMPORT_MODEL_STATE_TOOL_DESCRIPTION,
	IMPORT_MODEL_STATE_TOOL_NAME,
} from "../../config/tools";
import {importModelStateInputSchema} from "../../core/importModelState";
import {computeAppliedParameterIds} from "../../lib/computeAppliedParameterIds";
import {runTool, toolError, toolSuccess} from "../../lib/toolResponse";
import type {ModelContext} from "../../lib/webmcpAvailability";
import {zodToJsonSchema} from "../../lib/zodToJsonSchema";
import type {WebMcpToolsDeps} from "../webMcpToolsDeps";

export async function registerImportModelStateTool(
	modelContext: ModelContext,
	deps: WebMcpToolsDeps,
	signal: AbortSignal,
): Promise<void> {
	await modelContext.registerTool(
		{
			name: IMPORT_MODEL_STATE_TOOL_NAME,
			description: IMPORT_MODEL_STATE_TOOL_DESCRIPTION,
			inputSchema: zodToJsonSchema(importModelStateInputSchema),
			annotations: {
				readOnlyHint: false,
				untrustedContentHint: true,
			},
			execute: async (input) =>
				runTool(importModelStateInputSchema, input, async (parsed) => {
					const targetNamespace = deps.namespaceRef.current;
					const beforeValues = new Map(
						getParameterStates(targetNamespace).map((p) => [
							p.definition.id,
							p.state.uiValue,
						]),
					);
					const result =
						await deps.importModelStateRef.current(parsed);

					if (!result.success) {
						return toolError(
							`Error: ${result.message}\nRecovery: Verify modelStateId with create_model_state or list_parameter_definitions after a valid import.`,
							{
								success: false,
								message: result.message,
								invalidParameters:
									result.invalidParameters ?? [],
							},
						);
					}

					const appliedParameterIds = computeAppliedParameterIds(
						beforeValues,
						getParameterStates(targetNamespace),
					);

					const structuredContent = {
						success: true as const,
						appliedParameterIds,
						...(result.invalidParameters
							? {invalidParameters: result.invalidParameters}
							: {}),
					};

					const invalidCount = result.invalidParameters?.length ?? 0;
					const text =
						invalidCount > 0
							? `Imported model state. Applied ${appliedParameterIds.length} parameter(s); ${invalidCount} invalid.`
							: `Imported model state. Applied ${appliedParameterIds.length} parameter(s).`;

					return toolSuccess(text, structuredContent);
				}),
		},
		{signal},
	);
}
