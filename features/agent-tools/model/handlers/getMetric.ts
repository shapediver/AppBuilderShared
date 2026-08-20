import {
	AGENT_METRIC_OUTPUT_NAME,
	getMetricInputSchema,
	type GetMetricOutput,
} from "../../config/getMetric";
import {formatToolInputError} from "../../lib/formatToolInputError";
import type {AgentToolsDeps} from "../agentToolsDeps";

export async function handleGetMetric(
	input: unknown,
	deps: AgentToolsDeps,
): Promise<GetMetricOutput> {
	try {
		getMetricInputSchema.parse(input ?? {});
		const output = deps.getOutputByName(
			deps.controllerNamespace,
			AGENT_METRIC_OUTPUT_NAME,
		);
		if (!output) {
			return {found: false};
		}
		return {found: true, value: output.content};
	} catch (e) {
		return {
			found: false,
			message: formatToolInputError(e).errors[0].message,
		};
	}
}
