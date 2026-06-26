import type {IAppBuilder, IAppBuilderSettingsJson} from "./appbuilder";
import {
	type AppBuilderSettingsValidationEnv,
	isAppBuilderValidationEnabled,
} from "./appBuilderSettingsValidationEnv";
import {
	formatAppBuilderZodError,
	validateAppBuilder,
	validateAppBuilderSettingsJson,
} from "./appbuildertypecheck";
import {reportAppBuilderValidationError} from "./reportAppBuilderValidationError";
import {readAppBuilderValidationEnv} from "./readAppBuilderValidationEnv";

export {
	isAppBuilderValidationEnabled,
	type AppBuilderSettingsValidationEnv,
} from "./appBuilderSettingsValidationEnv";

export function parseAppBuilderSettingsJson(
	raw: unknown,
	env?: AppBuilderSettingsValidationEnv,
): IAppBuilderSettingsJson {
	const validationEnv = env ?? readAppBuilderValidationEnv();
	if (!isAppBuilderValidationEnabled(validationEnv)) {
		return raw as IAppBuilderSettingsJson;
	}
	const result = validateAppBuilderSettingsJson(raw);
	if (!result.success) {
		const message = `App Builder settings invalid:\n${formatAppBuilderZodError(result.error)}`;
		reportAppBuilderValidationError(message, "settings");
		throw new Error(message);
	}
	return result.data;
}

export function parseAppBuilderSkeleton(
	raw: unknown,
	env?: AppBuilderSettingsValidationEnv,
): IAppBuilder | Error {
	const validationEnv = env ?? readAppBuilderValidationEnv();
	if (!isAppBuilderValidationEnabled(validationEnv)) {
		return raw as IAppBuilder;
	}
	const result = validateAppBuilder(raw);
	if (!result.success) {
		const message = `App Builder layout invalid:\n${formatAppBuilderZodError(result.error)}`;
		reportAppBuilderValidationError(message, "layout");
		return new Error(message);
	}
	return result.data;
}
