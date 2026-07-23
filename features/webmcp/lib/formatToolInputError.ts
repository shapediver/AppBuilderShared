export function formatToolInputError(e: unknown): {
	errors: Array<{name: string; message: string}>;
} {
	return {
		errors: [
			{
				name: "*",
				message: e instanceof Error ? e.message : String(e),
			},
		],
	};
}
