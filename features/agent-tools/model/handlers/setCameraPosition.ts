import {
	setCameraPositionInputSchema,
	type SetCameraPositionOutput,
} from "../../config/setCameraPosition";
import {resolveViewportId} from "../../lib/resolveViewportId";
import {runParsedTool} from "../../lib/runParsedTool";
import type {AgentToolsDeps} from "../agentToolsDeps";

export async function handleSetCameraPosition(
	input: unknown,
	deps: AgentToolsDeps,
): Promise<SetCameraPositionOutput> {
	return runParsedTool(
		setCameraPositionInputSchema,
		input,
		async (parsed) => {
			const viewportId = resolveViewportId(parsed, deps);
			if (!viewportId) {
				return {success: false, message: "Viewport not found."};
			}
			return await deps.setCamera({
				viewportId,
				position: parsed.position,
				target: parsed.target,
			});
		},
		(message) => ({success: false, message}),
	);
}
