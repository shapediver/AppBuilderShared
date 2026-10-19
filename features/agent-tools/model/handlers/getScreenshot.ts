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
		async (parsed) => {
			const viewportId = resolveViewportId(deps);
			if (!viewportId) {
				return {success: false, message: "Viewport not found."};
			}
			const image_url = await deps.getScreenshot(viewportId, parsed);
			if (!image_url) {
				return {success: false, message: "Screenshot failed."};
			}
			return {success: true, image_url};
		},
		(message) => ({success: false, message}),
	);
}
