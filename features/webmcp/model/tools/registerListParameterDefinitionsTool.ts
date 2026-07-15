import {listParameterDefinitionsInputSchema} from "../../config/listParameterDefinitions";
import {
	LIST_PARAMETER_DEFINITIONS_TOOL_DESCRIPTION,
	LIST_PARAMETER_DEFINITIONS_TOOL_NAME,
} from "../../config/tools";
import {formatToolInputError} from "../../lib/formatToolInputError";
import {mapParameterDefinition} from "../../lib/parameterDefinitionMapper";
import type {ModelContext} from "../../lib/webmcpAvailability";
import {zodToJsonSchema} from "../../lib/zodToJsonSchema";
import type {WebMcpToolsDeps} from "../webMcpToolsDeps";

export async function registerListParameterDefinitionsTool(
	modelContext: ModelContext,
	deps: WebMcpToolsDeps,
	signal: AbortSignal,
): Promise<void> {
	await modelContext.registerTool(
		{
			name: LIST_PARAMETER_DEFINITIONS_TOOL_NAME,
			description: LIST_PARAMETER_DEFINITIONS_TOOL_DESCRIPTION,
			inputSchema: zodToJsonSchema(listParameterDefinitionsInputSchema),
			annotations: {
				readOnlyHint: true,
				untrustedContentHint: true,
			},
			execute: async (input) => {
				try {
					const parsed =
						listParameterDefinitionsInputSchema.parse(input);
					const filter = parsed.filter ?? "all";
					const targetNamespace =
						parsed.sessionId ?? deps.namespaceRef.current;
					let parameters = deps.getLiveParameters(targetNamespace);

					if (filter === "visible") {
						parameters = parameters.filter(
							(p) => !p.definition.hidden,
						);
					}

					return {
						parameters: parameters.map((param) =>
							mapParameterDefinition(param),
						),
					};
				} catch (e) {
					return {
						parameters: [],
						...formatToolInputError(e),
					};
				}
			},
		},
		{signal},
	);
}
