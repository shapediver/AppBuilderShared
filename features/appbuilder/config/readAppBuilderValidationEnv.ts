import type {AppBuilderSettingsValidationEnv} from "./appBuilderSettingsValidationEnv";

/** Vite `import.meta.env` when hooks omit an explicit validation env. */
export function readAppBuilderValidationEnv(): AppBuilderSettingsValidationEnv {
	return import.meta.env;
}
