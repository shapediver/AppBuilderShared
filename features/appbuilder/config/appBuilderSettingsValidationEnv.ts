/** Env keys read by {@link isAppBuilderValidationEnabled}. */
export type AppBuilderSettingsValidationEnv = {
	VITE_VALIDATE_SETTINGS?: string;
};

function isTrueish(value: string | null | undefined): boolean {
	return value === "true" || value === "1";
}

/**
 * When `true`, AppBuilder settings JSON and skeleton override data are
 * validated with Zod before use.
 *
 * Set in `.env`: `VITE_VALIDATE_SETTINGS=true`
 */
export function isAppBuilderValidationEnabled(
	env: AppBuilderSettingsValidationEnv,
): boolean {
	return isTrueish(env.VITE_VALIDATE_SETTINGS);
}
