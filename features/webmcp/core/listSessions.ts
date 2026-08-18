import {z} from "@AppBuilderLib/shared/lib/zod";
import type {ToolDef} from "./toolDefinition";

export const listSessionsInputSchema = z.strictObject({});

export const listSessionsOutputSchema = z.object({
	sessions: z.array(
		z.object({
			sessionId: z.string(),
		}),
	),
});

export type ListSessionsOutput = z.infer<typeof listSessionsOutputSchema>;

export const listSessionsTool: ToolDef<
	z.infer<typeof listSessionsInputSchema>,
	ListSessionsOutput
> = {
	name: "list_sessions",
	description: "List ids of sessions which offer parameters.",
	inputSchema: listSessionsInputSchema,
	outputSchema: listSessionsOutputSchema,
	annotations: {readOnlyHint: true, untrustedContentHint: true},
	execute: (deps, _input, _signal) => {
		const sessions = deps
			.listParameterNamespaces()
			.map((sessionId) => ({sessionId}));
		return Promise.resolve({sessions});
	},
	format: (output) => {
		const n = output.sessions.length;
		return `Found ${n} sessions. Next you can use one of the sessionIds with list_parameter_definitions.`;
	},
};
