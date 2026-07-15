import {getUiParameterRefs} from "@AppBuilderLib/features/appbuilder/lib/appbuilder";
import {listParameterDefinitionsInputSchema} from "../../config/listParameterDefinitions";
import {
	LIST_PARAMETER_DEFINITIONS_TOOL_DESCRIPTION,
	LIST_PARAMETER_DEFINITIONS_TOOL_NAME,
} from "../../config/tools";
import {filterVisibleParameters} from "../../lib/filterVisibleParameters";
import {formatToolInputError} from "../../lib/formatToolInputError";
import {mapParameterDefinition} from "../../lib/parameterDefinitionMapper";
import type {ModelContext} from "../../lib/webmcpAvailability";
import {zodToJsonSchema} from "../../lib/zodToJsonSchema";
import type {WebMcpToolsDeps} from "../webMcpToolsDeps";

function findParameterRef(
	deps: WebMcpToolsDeps,
	paramId: string,
	paramName: string,
	displayname?: string,
) {
	const refs = deps.appBuilderDataRef.current
		? getUiParameterRefs(deps.appBuilderDataRef.current)
		: [];

	return refs.find(
		(ref) =>
			ref.name === paramId ||
			ref.name === paramName ||
			ref.name === displayname,
	);
}

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
						const refs = deps.appBuilderDataRef.current
							? getUiParameterRefs(deps.appBuilderDataRef.current)
							: [];
						parameters = filterVisibleParameters(parameters, refs);
					}

					return {
						parameters: parameters.map((param) => {
							const def = param.definition;

							return mapParameterDefinition(
								param,
								findParameterRef(
									deps,
									def.id,
									def.name,
									def.displayname,
								),
							);
						}),
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
