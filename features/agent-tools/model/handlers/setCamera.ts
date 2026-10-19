import {
	setCameraInputSchema,
	type SetCameraOutput,
} from "../../config/setCamera";
import {resolveViewportId} from "../../lib/resolveViewportId";
import {runParsedTool} from "../../lib/runParsedTool";
import type {AgentToolsDeps} from "../agentToolsDeps";

export async function handleSetCamera(
	input: unknown,
	deps: AgentToolsDeps,
): Promise<SetCameraOutput> {
	return runParsedTool(
		setCameraInputSchema,
		input,
		async (parsed) => {
			const viewportId = resolveViewportId(deps);
			if (!viewportId) {
				return {success: false, message: "Viewport not found."};
			}
			return await deps.setCamera({viewportId, camera: parsed});
		},
		(message) => ({success: false, message}),
	);
}
