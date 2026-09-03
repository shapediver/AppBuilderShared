import type {ListActionControlsToolSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";
import {
	listActionControlsInputSchema,
	type ListedActionControl,
} from "../../config/listActionControls";
import {collectActionControls} from "../../lib/collectActionControls";
import {formatToolInputError} from "../../lib/formatToolInputError";
import type {AgentToolsDeps} from "../agentToolsDeps";

export async function handleListActionControls(
	input: unknown,
	settings: ListActionControlsToolSettings,
	deps: AgentToolsDeps,
): Promise<{
	actions: ListedActionControl[];
	errors?: {name: string; message: string}[];
}> {
	try {
		listActionControlsInputSchema.parse(input ?? {});
		return {
			actions: collectActionControls({
				appBuilder: deps.getAppBuilder(),
				defaultToolbarActions: deps.getDefaultToolbarActions(),
				settings,
			}),
		};
	} catch (e) {
		return {actions: [], ...formatToolInputError(e)};
	}
}
