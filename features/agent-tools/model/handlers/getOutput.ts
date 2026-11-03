import {
	getOutputInputSchema,
	type GetOutputOutput,
} from "../../config/getOutput";
import {runParsedTool} from "../../lib/runParsedTool";
import type {AgentToolsDeps} from "../agentToolsDeps";

export async function handleGetOutput(
	input: unknown,
	deps: AgentToolsDeps,
): Promise<GetOutputOutput> {
	return runParsedTool(
		getOutputInputSchema,
		input ?? {},
		(parsed) => {
			const namespace = parsed.namespace ?? deps.controllerNamespace;
			const output = deps.getOutputByName(namespace, parsed.output);
			if (!output) {
				return {found: false};
			}
			return {found: true, content: output.content};
		},
		(message) => ({found: false, message}),
	);
}
