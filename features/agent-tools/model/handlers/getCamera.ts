import {
	getCameraInputSchema,
	type GetCameraOutput,
} from "../../config/getCamera";
import {resolveViewportId} from "../../lib/resolveViewportId";
import {runParsedTool} from "../../lib/runParsedTool";
import type {AgentToolsDeps} from "../agentToolsDeps";

export async function handleGetCamera(
	input: unknown,
	deps: AgentToolsDeps,
): Promise<GetCameraOutput> {
	return runParsedTool(
		getCameraInputSchema,
		input ?? {},
		() => {
			const viewportId = resolveViewportId(deps);
			if (!viewportId) {
				return {success: false, message: "Viewport not found."};
			}
			const camera = deps.getCamera(viewportId);
			if (!camera) {
				return {success: false, message: "Camera not found."};
			}
			return {success: true, camera};
		},
		(message) => ({success: false, message}),
	);
}
