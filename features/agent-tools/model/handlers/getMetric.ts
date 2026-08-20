import {
	AGENT_METRIC_OUTPUT_NAME,
	getMetricInputSchema,
	type GetMetricOutput,
} from "../../config/getMetric";
import {runParsedTool} from "../../lib/runParsedTool";
import type {AgentToolsDeps} from "../agentToolsDeps";

export async function handleGetMetric(
	input: unknown,
	deps: AgentToolsDeps,
): Promise<GetMetricOutput> {
	return runParsedTool(
		getMetricInputSchema,
		input ?? {},
		() => {
			const output = deps.getOutputByName(
				deps.controllerNamespace,
				AGENT_METRIC_OUTPUT_NAME,
			);
			if (!output) {
				return {found: false};
			}
			return {found: true, value: output.content};
		},
		(message) => ({found: false, message}),
	);
}
