import {getParameterStates} from "@AppBuilderLib/entities/parameter/lib/parameterStates";
import {importModelStateInputSchema} from "../../config/importModelState";
import {
	IMPORT_MODEL_STATE_TOOL_DESCRIPTION,
	IMPORT_MODEL_STATE_TOOL_NAME,
} from "../../config/tools";
import {computeAppliedParameterIds} from "../../lib/computeAppliedParameterIds";
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
			execute: async (input) => {
				try {
					const parsed = importModelStateInputSchema.parse(input);
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
						return {
							success: false as const,
							message: result.message,
							invalidParameters: result.invalidParameters ?? [],
						};
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
				} catch (e) {
					return {
						success: false as const,
						message: e instanceof Error ? e.message : String(e),
						invalidParameters: [],
					};
				}
			},
		},
		{signal},
	);
}
