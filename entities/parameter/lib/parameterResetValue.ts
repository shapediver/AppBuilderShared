import {IShapeDiverParameterDefinition} from "../config/parameter";

/**
 * Parameter settings understood by App Builder for parameters of any type
 * (parameters of the model, custom parameters, interaction parameters, ...).
 * The settings can be defined by the model, by the definition of custom parameters,
 * or by the "overrides" of parameter references in the App Builder JSON.
 * The reset value is applied by the parameter store after each execution
 * (see IShapeDiverParameterActions.execute and setExecutedValue). A reset value
 * defined by overrides is registered with the store once the parameter component
 * is mounted (see IShapeDiverParameterActions.setResetValue).
 * The interaction parameter components (selection, gumball, rectangle transform,
 * drawing) reflect the reset by following the committed value.
 */
export interface IParameterResetValueSettings {
	/**
	 * Optional value the parameter is reset to after each execution of a value,
	 * including the initial computation of the model with the default values.
	 * The reset value is committed without a further execution, i.e. it is used
	 * by the next execution (e.g. caused by a change of another parameter).
	 * The value must be valid for the parameter.
	 *
	 * Example: A selection parameter used as a trigger. The selection is
	 * executed once and shall not be part of subsequent computations
	 * (resetValue: '{"names":[]}').
	 */
	resetValue?: unknown;
}

/**
 * Resolve the value a parameter shall be reset to after an execution,
 * as defined by the "resetValue" property of the parameter settings.
 *
 * @param definition The parameter definition.
 * @returns The value to commit after an execution, or undefined if the parameter shall not be reset.
 */
export function getResetValue(
	definition: IShapeDiverParameterDefinition,
): unknown {
	const settings = definition.settings as
		| IParameterResetValueSettings
		| undefined;
	const resetValue = settings?.resetValue;

	return resetValue === null ? undefined : resetValue;
}
