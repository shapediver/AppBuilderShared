import {
	LIST_SESSIONS_TOOL_DESCRIPTION,
	LIST_SESSIONS_TOOL_NAME,
} from "../../config/tools";
import {listSessionsInputSchema} from "../../core/listSessions";
import {runTool, toolSuccess} from "../../lib/toolResponse";
import type {ModelContext} from "../../lib/webmcpAvailability";
import {zodToJsonSchema} from "../../lib/zodToJsonSchema";
import type {WebMcpToolsDeps} from "../webMcpToolsDeps";

export async function registerListSessionsTool(
	modelContext: ModelContext,
	deps: WebMcpToolsDeps,
	signal: AbortSignal,
): Promise<void> {
	await modelContext.registerTool(
		{
			name: LIST_SESSIONS_TOOL_NAME,
			description: LIST_SESSIONS_TOOL_DESCRIPTION,
			inputSchema: zodToJsonSchema(listSessionsInputSchema),
			annotations: {
				readOnlyHint: true,
				untrustedContentHint: true,
			},
			execute: async (input) =>
				runTool(listSessionsInputSchema, input, () => {
					const sessions = deps
						.listParameterNamespaces()
						.map((sessionId) => ({sessionId}));
					const n = sessions.length;
					return toolSuccess(
						`Found ${n} sessions. Next you can use one of the sessionIds with list_parameter_definitions.`,
						{sessions},
					);
				}),
		},
		{signal},
	);
}
