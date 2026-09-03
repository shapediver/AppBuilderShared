import {setParameterValuesInputSchema} from "../../config/setParameterValues";
import {formatToolInputError} from "../../lib/formatToolInputError";
import {applyParameterUpdates} from "../../lib/resolveSetParameterUpdates";
import type {AgentToolsDeps} from "../agentToolsDeps";

export async function handleSetParameterValues(
	input: unknown,
	deps: AgentToolsDeps,
): Promise<{applied: string[]; errors: {name: string; message: string}[]}> {
	try {
		const parsed = setParameterValuesInputSchema.parse(input);
		return await applyParameterUpdates(
			deps.controllerNamespace,
			deps.getLiveParameters,
			parsed.updates,
			deps.batchParameterValueUpdate,
		);
	} catch (e) {
		return {applied: [], ...formatToolInputError(e)};
	}
}
