import {waitForAppBuilderSessionIdle} from "@AppBuilderLib/features/appbuilder/model/waitForAppBuilderSessionIdle";
import type {ResolvedSpecificTool} from "../config/resolveSpecificTools";
import type {RunActionControlResult} from "../config/triggerActionControl";
import {bindAgentToolSources} from "../lib/bindAgentToolSources";
import {validateToolInput} from "../lib/validateToolInput";
import type {AgentToolsDeps} from "./agentToolsDeps";
import {runActionControl} from "./runActionControl";

/** Run one specific tool's hidden action sequence. Does not throw. */
export async function runSpecificTool(
	tool: ResolvedSpecificTool,
	input: unknown,
	deps: AgentToolsDeps,
): Promise<RunActionControlResult> {
	if (tool.actionSequence.length === 0) {
		return {success: false, message: "no actionSequence"};
	}
	const schemaMessage = validateToolInput(tool.inputSchema, input);
	if (schemaMessage) {
		return {success: false, message: schemaMessage};
	}
	const bound = bindAgentToolSources(tool.actionSequence, input);
	if (!bound.ok) {
		return {success: false, message: bound.message};
	}
	for (const definition of bound.actions) {
		const result = await runActionControl({definition}, deps);
		if (!result.success) return result;
		await waitForAppBuilderSessionIdle();
	}
	return {success: true};
}
