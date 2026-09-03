import type {ListActionControlsToolSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";
import {
	triggerActionControlInputSchema,
	type RunActionControlResult,
} from "../../config/triggerActionControl";
import {findActionControlByName} from "../../lib/collectActionControls";
import {formatToolInputError} from "../../lib/formatToolInputError";
import type {AgentToolsDeps} from "../agentToolsDeps";
import {runActionControl} from "../runActionControl";

/** Uses the same agent settings as `list_action_controls` (intentional). */
export async function handleTriggerActionControl(
	input: unknown,
	settings: ListActionControlsToolSettings,
	deps: AgentToolsDeps,
): Promise<RunActionControlResult> {
	try {
		const parsed = triggerActionControlInputSchema.parse(input);
		const ref = findActionControlByName(
			{
				appBuilder: deps.getAppBuilder(),
				defaultToolbarActions: deps.getDefaultToolbarActions(),
				settings,
			},
			parsed.name,
		);
		if (!ref) {
			return {
				success: false,
				message: `Action "${parsed.name}" does not exist.`,
			};
		}
		return await runActionControl(ref, deps);
	} catch (e) {
		return {
			success: false,
			message: formatToolInputError(e).errors[0].message,
		};
	}
}
