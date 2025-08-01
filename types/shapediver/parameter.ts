import {IShapeDiverParamOrExport} from "@AppBuilderShared/types/shapediver/common";
import {ShapeDiverResponseParameter} from "@shapediver/viewer.session";

/**
 * The static definition of a parameter.
 * We reuse the definition of the parameter on the Geometry Backend here.
 */
export type IShapeDiverParameterDefinition = ShapeDiverResponseParameter & {
	/**
	 * Optional step value for numeric parameters.
	 */
	step?: number;
};

/**
 * The dynamic properties of a parameter.
 */
export interface IShapeDiverParameterState<T> {
	/**
	 * The current value according to the user interface.
	 * This value can be assumed to be valid according to the definition of the parameter.
	 */
	readonly uiValue: T | string;

	/**
	 * The value corresponding to the latest successful execution, in case the parameter
	 * makes use of background executions like customization calls to ShapeDiver.
	 * This corresponds to the sessionValue property of parameters defined by the ShapeDiver viewer.
	 */
	readonly execValue: T | string;

	/**
	 * True if the uiValue is dirty (does not match the execValue).
	 * This might be the case during background executions.
	 */
	readonly dirty: boolean;

	/**
	 * Get the string representation of the currently executed value.
	 * This is useful for parameters of type "File", whose execValue is a file object.
	 * The value returned by this function is the id assigned to the uploaded file, if available.
	 * @returns
	 */
	stringExecValue(): string;
}

/**
 * Actions which can be taken on a parameter.
 */
export interface IShapeDiverParameterActions<T> {
	/**
	 * Set the ui value of the parameter.
	 * The provided value must be valid, otherwise this function will return false.
	 * Note: Does not call execute.
	 *
	 * @param value the value to use for setting state.uiValue
	 */
	setUiValue(value: T | string): boolean;

	/**
	 * Set the ui value and the exec value of the parameter.
	 * The provided value must be valid, otherwise this function will return false.
	 * Note: Does not call execute.
	 * CAUTION: Typically you want to use setUiValue instead of this function.
	 *
	 * @param value the value to use for setting state.uiValue and state.execValue
	 *
	 * @returns true if the value was set, false if the value was invalid.
	 */
	setUiAndExecValue(value: T | string): boolean;

	/**
	 * Run background executions, and update state.execValue on success.
	 * Note: The returned promise might not resolve for quite some time, e.g. in
	 * case parameter changes are waiting to be confirmed by the user.
	 *
	 * @param forceImmediate Set to true if the change should be executed immediately
	 *                       regardless of other settings.
	 * @param skipHistory If true, skip the creation of a history entry after successful execution.
	 * @param acceptAll If true and if forceImmediate, accept all pending changes for other
	 * 					parameters of the same namespace.
	 *
	 * @returns the value that was executed.
	 */
	execute(
		forceImmediate?: boolean,
		skipHistory?: boolean,
		acceptAll?: boolean,
	): Promise<T | string>;

	/**
	 * Evaluates if a given value is valid for this parameter.
	 *
	 * @param value the value to evaluate
	 * @param throwError if true, an error is thrown if validation does not pass (default: false)
	 */
	isValid(value: any, throwError?: boolean): boolean;

	/**
	 * Check whether the given value is different from the current ui value.
	 *
	 * @param value the value to evaluate
	 */
	isUiValueDifferent(value: any): boolean;

	/**
	 * Resets the ui value to the default value.
	 * Note: Does not call execute.
	 */
	resetToDefaultValue(): void;

	/**
	 * Resets the ui value to execValue.
	 * Note: Does not call execute.
	 */
	resetToExecValue(): void;
}

/**
 * A parameter including its definition (static properties) and its state.
 */
export interface IShapeDiverParameter<T> extends IShapeDiverParamOrExport {
	/** The static definition of the parameter. */
	readonly definition: IShapeDiverParameterDefinition;

	/**
	 * The dynamic properties (aka the "state") of the parameter.
	 * Reactive components can react to this state, but not update it.
	 */
	readonly state: IShapeDiverParameterState<T>;

	/**
	 * Actions which can be taken on the parameter.
	 */
	readonly actions: IShapeDiverParameterActions<T>;

	/**
	 * If true, changes are not executed immediately, but the user is presented with a
	 * possibility to accept or reject the changes.
	 */
	readonly acceptRejectMode: boolean;
}

/**
 * Executor interface for parameters.
 * Used for executing parameter changes, e.g. using an IParameterApi provided by
 * a ShapeDiver 3D Viewer session.
 * Implementations of this interface are used in the implementation of
 * IShapeDiverStoreParameters to provide behavior like the following:
 *   * immediate execution of parameter changes
 *   * deferred execution, requiring confirmation by the user
 *
 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/IParameterApi.html
 */
export interface IShapeDiverParameterExecutor<T> {
	/**
	 * Execute a parameter change, e.g. using an IParameterApi provided
	 * by a ShapeDiver 3D Viewer session.
	 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/IParameterApi.html
	 *
	 * Note: The returned promise might not resolve for quite some time, e.g. in
	 * case parameter changes are waiting to be confirmed by the user.
	 *
	 * @param uiValue The new value to execute.
	 * @param execValue The latest successfully executed value.
	 * @param forceImmediate Set to true if the change should be executed immediately
	 *                       regardless of other settings.
	 * @param skipHistory If true, skip the creation of a history entry after successful execution.
	 * @param acceptAll If true and if forceImmediate, accept all pending changes for other
	 * 					parameters of the same namespace.
	 *
	 * @returns the value that was executed, which might be different from uiValue and execValue.
	 */
	readonly execute: (
		uiValue: T | string,
		execValue: T | string,
		forceImmediate?: boolean,
		skipHistory?: boolean,
		acceptAll?: boolean,
	) => Promise<T | string>;

	/**
	 * Evaluates if a given value is valid.
	 *
	 * @param value the value to evaluate
	 * @param throwError if true, an error is thrown if validation does not pass (default: false)
	 */
	readonly isValid: (value: any, throwError?: boolean) => boolean;

	/**
	 * Stringify the given value according to the parameter definition.
	 */
	readonly stringify: (value: any) => string;

	/**
	 * Definition of the parameter.
	 */
	readonly definition: ShapeDiverResponseParameter;
}
