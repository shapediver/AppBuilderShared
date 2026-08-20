import {
	getScreenshotInputSchema,
	type GetScreenshotOutput,
} from "../../config/getScreenshot";
import {formatToolInputError} from "../../lib/formatToolInputError";
import type {AgentToolsDeps} from "../agentToolsDeps";

export async function handleGetScreenshot(
	input: unknown,
	deps: AgentToolsDeps,
): Promise<GetScreenshotOutput> {
	try {
		const parsed = getScreenshotInputSchema.parse(input ?? {});
		const viewportId = parsed.viewportId ?? deps.getViewportId();
		if (!viewportId) {
			return {success: false, message: "Viewport not found."};
		}
		const image = await deps.getScreenshot(viewportId);
		if (!image) {
			return {success: false, message: "Screenshot failed."};
		}
		return {success: true, image};
	} catch (e) {
		return {
			success: false,
			message: formatToolInputError(e).errors[0].message,
		};
	}
}
