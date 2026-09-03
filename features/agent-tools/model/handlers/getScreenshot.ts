import {
	getScreenshotInputSchema,
	type GetScreenshotOutput,
} from "../../config/getScreenshot";
import {resolveViewportId} from "../../lib/resolveViewportId";
import {runParsedTool} from "../../lib/runParsedTool";
import type {AgentToolsDeps} from "../agentToolsDeps";

export async function handleGetScreenshot(
	input: unknown,
	deps: AgentToolsDeps,
): Promise<GetScreenshotOutput> {
	return runParsedTool(
		getScreenshotInputSchema,
		input ?? {},
		async () => {
			const viewportId = resolveViewportId(deps);
			if (!viewportId) {
				return {success: false, message: "Viewport not found."};
			}
			const image = await deps.getScreenshot(viewportId);
			if (!image) {
				return {success: false, message: "Screenshot failed."};
			}
			return {success: true, image};
		},
		(message) => ({success: false, message}),
	);
}
