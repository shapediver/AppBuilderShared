import {NotificationAction} from "@AppBuilderShared/types/context/notificationcontext";
import {IShapeDiverParameter} from "@AppBuilderShared/types/shapediver/parameter";
import {z} from "zod";

export interface ParameterValidationResult {
	/** Validated (id,value) pairs of parameters */
	validParameters: {[key: string]: any};
	/** Names or IDs of parameters present in the input that could not be matched  */
	skippedParameters: string[];
	/** Whether any valid parameters were found */
	hasValidParameters: boolean;
}

const ParameterArraySchema = z.array(
	z.object({
		id: z.string(),
		value: z.any(),
		name: z.string().optional(),
	}),
);

type ParameterArrayType = z.infer<typeof ParameterArraySchema>;

/**
 * Checks if the given value is a valid import parameter schema
 * @param value
 * @returns
 */
export const isImportParameterArray = (
	value: any,
): value is ParameterArrayType => {
	return ParameterArraySchema.safeParse(value).success;
};

/**
 * Filters and validates imported parameters against current session parameters
 * @param parameterStates - Array of current parameter states from the session
 * @param parameterArray - Array of parameters to validate
 * @returns Validation result with valid parameters, missing parameters
 */
export function filterAndValidateParameters(
	parameterStates: IShapeDiverParameter<any>[],
	parameterArray: ParameterArrayType,
): ParameterValidationResult {
	const validParameters: {[key: string]: any} = {};
	const skippedParameters: string[] = [];

	for (const param of parameterArray) {
		// Skip parameters without id or value
		if (!param.id || param.value === undefined) {
			continue;
		}

		// Try to find parameter by id or name
		let paramState = parameterStates.find(
			(p) => p.definition.id === param.id,
		);
		if (!paramState && param.name) {
			paramState = parameterStates.find(
				(p) => p.definition.name === param.name,
			);
		}

		if (!paramState) {
			skippedParameters.push(param.name || param.id);
			continue;
		}

		// Validate parameter value
		if (!paramState.actions.isValid(param.value)) {
			skippedParameters.push(param.name || param.id);
			continue;
		}

		validParameters[param.id] = param.value;
	}

	return {
		validParameters,
		skippedParameters: skippedParameters,
		hasValidParameters: Object.keys(validParameters).length > 0,
	};
}

/**
 * Filters and validates parameters from model state (object format)
 * @param parameterStates - Array of current parameter states from the session
 * @param parameterObject - Object with parameter id as key and value as value
 * @returns Validation result with valid parameters, missing parameters, and accept/reject mode info
 */
export function filterAndValidateModelStateParameters(
	parameterStates: IShapeDiverParameter<any>[],
	parameterObject: {[key: string]: any},
): ParameterValidationResult {
	// Convert object format to array format for consistency
	const parameterArray: ParameterArrayType = Object.entries(
		parameterObject,
	).map(([id, value]) => ({
		id,
		value,
	}));

	return filterAndValidateParameters(parameterStates, parameterArray);
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

	if (result.skippedParameters.length > 0) {
		return {
			type: NotificationAction.WARNING,
			message: `The following parameters could not be matched or ar invalid: ${result.skippedParameters.join(", ")}`,
		};
	}

	return {
		type: NotificationAction.SUCCESS,
		message: successMessage,
	};
}
