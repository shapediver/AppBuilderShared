export function parseExecuteToolData(
	data: unknown,
): {name: string; input: unknown} | undefined {
	if (!data || typeof data !== "object") {
		return undefined;
	}
	if (typeof (data as {name?: unknown}).name !== "string") {
		return undefined;
	}
	const {name, input} = data as {name: string; input?: unknown};
	return {name, input};
}
