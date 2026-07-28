import {
	LIST_PARAMETER_DEFINITIONS_TOOL_DESCRIPTION,
	LIST_PARAMETER_DEFINITIONS_TOOL_NAME,
} from "../../config/tools";
import {listParameterDefinitionsInputSchema} from "../../core/listParameterDefinitions";
import {mapParameterDefinition} from "../../lib/parameterDefinitionMapper";
import {runTool, toolError, toolSuccess} from "../../lib/toolResponse";
import type {ModelContext} from "../../lib/webmcpAvailability";
import {zodToJsonSchema} from "../../lib/zodToJsonSchema";
import type {WebMcpToolsDeps} from "../webMcpToolsDeps";

const DEFAULT_LIMIT = 20;

function matchesSearch(
	definition: {id: string; name: string; displayname?: string},
	search: string,
): boolean {
	const needle = search.toLowerCase();
	return (
		definition.id.toLowerCase().includes(needle) ||
		definition.name.toLowerCase().includes(needle) ||
		(definition.displayname?.toLowerCase().includes(needle) ?? false)
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
			execute: async (input) =>
				runTool(
					listParameterDefinitionsInputSchema,
					input,
					(parsed) => {
						const filter = parsed.filter ?? "all";
						const namespaces = deps.listParameterNamespaces();

						if (
							parsed.sessionId !== undefined &&
							!namespaces.includes(parsed.sessionId)
						) {
							return toolError(
								`Error: Session "${parsed.sessionId}" does not exist.\nRecovery: Use list_sessions or avoid specifying sessionId to list parameter definitions for all sessions.`,
							);
						}

						const targetNamespaces =
							parsed.sessionId !== undefined
								? [parsed.sessionId]
								: namespaces;

						const search = parsed.search?.trim();
						const parameters = targetNamespaces.flatMap(
							(sessionId) => {
								let params = deps.getLiveParameters(sessionId);
								if (filter === "visible") {
									params = params.filter(
										(p) => !p.definition.hidden,
									);
								}
								if (search) {
									params = params.filter((p) =>
										matchesSearch(p.definition, search),
									);
								}
								return params.map((param) =>
									mapParameterDefinition(param, sessionId),
								);
							},
						);

						const limit = parsed.limit ?? DEFAULT_LIMIT;
						const offset = parsed.offset ?? 0;
						const total = parameters.length;
						const page = parameters.slice(offset, offset + limit);
						const truncated = offset + limit < total;

						const text = truncated
							? `Found ${page.length} parameter definitions for ${targetNamespaces.length} sessions (page starting at offset ${offset}; ${total - offset - page.length} more remain). Use set_parameter_values to update the state of parameters. More parameters match beyond this page. Raise offset (e.g. offset=${offset + limit}) or narrow your search.`
							: `Found ${page.length} parameter definitions for ${targetNamespaces.length} sessions. Use set_parameter_values to update the state of parameters.`;

						return toolSuccess(
							text,
							truncated
								? {parameters: page, truncated: true}
								: {parameters: page},
						);
					},
				),
		},
		{signal},
	);
}
