const MODEL_STATE_ID_PLACEHOLDER = "{modelStateId}";

export function resolveModelStateMessage(
	message: string | undefined,
	modelStateId?: string,
): string | undefined {
	if (!message) return undefined;
	if (!modelStateId) return message;

	return message.split(MODEL_STATE_ID_PLACEHOLDER).join(modelStateId);
}
