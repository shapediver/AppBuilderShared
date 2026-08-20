import {
	setCameraPositionInputSchema,
	type SetCameraPositionOutput,
} from "../../config/setCameraPosition";
import {formatToolInputError} from "../../lib/formatToolInputError";
import type {AgentToolsDeps} from "../agentToolsDeps";

export async function handleSetCameraPosition(
	input: unknown,
	deps: AgentToolsDeps,
): Promise<SetCameraPositionOutput> {
	try {
		const parsed = setCameraPositionInputSchema.parse(input);
		const viewportId = parsed.viewportId ?? deps.getViewportId();
		if (!viewportId) {
			return {success: false, message: "Viewport not found."};
		}
		return await deps.setCamera({
			viewportId,
			position: parsed.position,
			target: parsed.target,
		});
	} catch (e) {
		return {
			success: false,
			message: formatToolInputError(e).errors[0].message,
		};
	}
}
