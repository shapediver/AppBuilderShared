import {NotificationAction} from "@AppBuilderShared/types/context/notificationcontext";

export interface ParameterValidationResult {
	validParameters: {[key: string]: any};
	missingParameters: string[];
	hasValidParameters: boolean;
}

export interface ImportParameter {
	id: string;
	value: any;
	name?: string;
}

export interface SessionParameterStore {
	getState: () => {
		actions: {
			isValid: (value: any) => boolean;
		};
	};
}

/**
 * Filters and validates imported parameters against current session parameters
 * @param sessionParameters - Object with parameter stores keyed by parameter id
 * @param parameters - Array of parameters to validate
 * @returns Validation result with valid parameters, missing parameters, and accept/reject mode info
 */
export function filterAndValidateParameters(
	sessionParameters: {[key: string]: SessionParameterStore},
	parameters: ImportParameter[],
): ParameterValidationResult {
	const validParameters: {[key: string]: any} = {};
	const missingParameters: string[] = [];

	for (const param of parameters) {
		// Skip parameters without id or value
		if (!param.id || param.value === undefined) {
			continue;
		}

		// Try to find parameter by id or name
		const sessionParam =
			sessionParameters[param.id] || sessionParameters[param.name || ""];

		if (!sessionParam) {
			missingParameters.push(param.name || param.id);
			continue;
		}

		// Validate parameter value
		const paramActions = sessionParam.getState().actions;
		if (!paramActions.isValid(param.value)) {
			missingParameters.push(param.name || param.id);
			continue;
		}

		validParameters[param.id] = param.value;
	}

	return {
		validParameters,
		missingParameters,
		hasValidParameters: Object.keys(validParameters).length > 0,
	};
}

/**
 * Filters and validates parameters from model state (object format)
 * @param sessionParameters - Object with parameter stores keyed by parameter id
 * @param parameters - Object with parameter id as key and value as value
 * @returns Validation result with valid parameters, missing parameters, and accept/reject mode info
 */
export function filterAndValidateModelStateParameters(
	sessionParameters: {[key: string]: SessionParameterStore},
	parameters: {[key: string]: any},
): ParameterValidationResult {
	// Convert object format to array format for consistency
	const parameterArray: ImportParameter[] = Object.entries(parameters).map(
		([id, value]) => ({
			id,
			value,
		}),
	);

	return filterAndValidateParameters(sessionParameters, parameterArray);
}

/**
 * Generates user feedback messages based on validation results
 * @param result - The parameter validation result
 * @param successMessage - Message to show when all parameters are valid
 * @returns Object with success, warning, or error message
 */
export function generateParameterFeedback(
	result: ParameterValidationResult,
	successMessage: string = "Parameters processed successfully",
): {
	type: NotificationAction;
	message: string;
} {
	if (!result.hasValidParameters) {
		return {
			type: NotificationAction.ERROR,
			message:
				"The parameters do not match the parameters of this model.",
		};
	}

	if (result.missingParameters.length > 0) {
		return {
			type: NotificationAction.WARNING,
			message: `The following parameters are missing or invalid: ${result.missingParameters.join(", ")}`,
		};
	}

	return {
		type: NotificationAction.SUCCESS,
		message: successMessage,
	};
}
