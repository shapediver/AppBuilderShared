export type AppBuilderValidationErrorKind = "settings" | "layout";

const DEV_VALIDATION_ENDPOINT = "/__appbuilder/dev-validation-error";

/**
 * In Vite dev, POST validation failures to the dev server so they appear in the
 * terminal where `npm run start` / `pnpm start` is running (useful for agents).
 */
export function reportAppBuilderValidationError(
	message: string,
	kind: AppBuilderValidationErrorKind,
): void {
	if (!import.meta.env.DEV || typeof window === "undefined") return;

	void fetch(DEV_VALIDATION_ENDPOINT, {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify({message, kind}),
	}).catch(() => {
		// Dev middleware may be unavailable (e.g. preview build).
	});
}
