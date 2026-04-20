import {IShapeDiverParameterDefinition} from "../config/parameter";

/**
 * Build validation function for a parameter from its settings.
 * Returns a validator function compatible with Mantine form.
 * Returns null if no validation rule is defined.
 */
export function buildParameterValidator(
	definition: IShapeDiverParameterDefinition,
): ((value: any) => string | null) | null {
	if (!definition.settings) return null;

	const settings = definition.settings as Record<string, any>;
	const validationRule = settings.validationrule;
	const validationError = settings.validationerror;

	if (!validationRule) return null;

	return (value: any) => {
		try {
			const regex = new RegExp(validationRule);
			const stringValue = String(value || "");
			if (!regex.test(stringValue)) {
				return validationError || "Validation failed";
			}
			return null;
		} catch (error) {
			console.error(
				`Invalid regex for parameter ${definition.id}:`,
				validationRule,
				error,
			);
			return null;
		}
	};
}
