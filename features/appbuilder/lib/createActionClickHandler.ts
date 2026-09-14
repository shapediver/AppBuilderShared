/**
 * Button onClick wrapper around an action `run`.
 * Loading is optional UI state; the executable work lives in `run`.
 */
export function createActionClickHandler(
	run: () => void | Promise<void>,
	options?: {
		disabled?: boolean;
		setLoading?: (loading: boolean) => void;
	},
): () => void {
	return () => {
		if (options?.disabled) return;
		void (async () => {
			options?.setLoading?.(true);
			try {
				await run();
			} finally {
				options?.setLoading?.(false);
			}
		})();
	};
}
