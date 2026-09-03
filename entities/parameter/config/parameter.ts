import {ShapeDiverResponseParameter} from "@shapediver/viewer.session";
import {IShapeDiverParamOrExport} from "./common";

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
	 * The value that was executed by the latest successful execution, in case the
	 * parameter makes use of background executions like customization calls to ShapeDiver.
	 * Note that this is not necessarily the value the parameter is committed to,
	 * see {@link commitValue}.
	 */
	readonly execValue: T | string;

	/**
	 * The value the parameter is committed to, i.e. the value the next execution uses
	 * and the value pending changes are reset to.
	 * Typically this is the value of the latest successful execution (see {@link execValue}).
	 * It differs from execValue in case a value was committed without an execution,
	 * e.g. by resetting the parameter after an execution (see the "resetValue" setting
	 * of parameters), or by a value defined by the model as a result of a computation.
	 * This corresponds to the sessionValue property of parameters defined by the ShapeDiver viewer.
	 */
	readonly commitValue: T | string;

	/**
	 * Revision of the commit value, incremented whenever the parameter is committed
	 * (by an execution, or by a value executed elsewhere), even if the committed
	 * value did not change. Components which keep their own draft of the value
	 * can use this to detect that an execution completed, e.g. when the parameter
	 * is reset to the same value after each execution.
	 */
	readonly commitRevision: number;

	/**
	 * True if the uiValue is dirty (does not match the commitValue).
	 * This might be the case during background executions.
	 */
	readonly dirty: boolean;

	/**
	 * Disable other parameters of the same namespace.
	 * This is useful for parameters like interaction parameters, where it is not possible to change multiple parameters at the same time.
	 */
	readonly disableOtherParameters: boolean;

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
	 * Set a value as the executed value of the parameter, i.e. set the exec value,
	 * and commit the value (ui value and commit value).
	 * Use this for values which were executed elsewhere, e.g. values defined by
	 * the model as a result of a computation, or values restored from history.
	 * In case a reset value is defined for the parameter (see the "resetValue"
	 * setting), the reset value is committed instead, like after an execution.
	 * The provided value must be valid, otherwise this function will return false.
	 * Note: Does not call execute. For parameters of a session, the committed
	 * value is committed to the session.
	 * CAUTION: Typically you want to use setUiValue instead of this function.
	 *
	 * @param value the value which was executed
	 *
	 * @returns true if the value was set, false if the value was invalid.
	 */
	setExecutedValue(value: T | string): boolean;

	/**
	 * Run background executions, and update state.execValue on success.
	 * The executed value is committed, unless a reset value is defined for the
	 * parameter (see the "resetValue" setting), in which case the reset value is
	 * committed without a further execution.
	 * Note: The returned promise might not resolve for quite some time, e.g. in
	 * case parameter changes are waiting to be confirmed by the user.
	 *
	 * @param forceImmediate Set to true if the change should be executed immediately
	 *                       regardless of other settings.
	 * @param skipHistory If true, skip the creation of a history entry after successful execution.
	 * @param acceptAll If true and if forceImmediate, accept all pending changes for other
	 * 					parameters of the same namespace.
	 * @param skipUrlUpdate If true, skip updating the URL after executing the changes.
	 * @param forceSameValue If true, execute even when the UI value equals the latest executed value.
	 *
	 * @returns the value that was executed.
	 */
	execute(
		forceImmediate?: boolean,
		skipHistory?: boolean,
		acceptAll?: boolean,
		skipUrlUpdate?: boolean,
		forceSameValue?: boolean,
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
	 * Resets the ui value to the commit value, i.e. discards pending changes.
	 * Note: Does not call execute.
	 */
	resetToCommitValue(): void;

	/**
	 * Override the value the parameter is reset to after each execution,
	 * see the "resetValue" property of the parameter settings.
	 * Used to apply a reset value defined by the overrides of a parameter
	 * reference in the App Builder JSON. The override is kept until it is
	 * replaced, set to undefined to remove it. In case the latest execution
	 * (or the initial computation) has not been followed by a reset yet, the
	 * reset value is committed right away.
	 *
	 * @param value the reset value, or undefined
	 */
	setResetValue(value: unknown): void;

	/**
	 * Disable or enable other parameters of the same namespace.
	 * This is useful for parameters like interaction parameters, where it is not possible to change multiple parameters at the same time.
	 * @param disable true to disable other parameters, false to enable them
	 */
	setDisableOtherParameters(disable: boolean): void;
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

	/**
	 * Optional override of the value the parameter is reset to after each execution,
	 * see {@link IShapeDiverParameterActions.setResetValue}.
	 */
	readonly resetValueOverride?: unknown;
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
	 * @param commitValue The value the parameter is committed to, see {@link IShapeDiverParameterState.commitValue}.
	 * @param forceImmediate Set to true if the change should be executed immediately
	 *                       regardless of other settings.
	 * @param skipHistory If true, skip the creation of a history entry after successful execution.
	 * @param acceptAll If true and if forceImmediate, accept all pending changes for other
	 * 					parameters of the same namespace.
	 * @param skipUrlUpdate If true, skip updating the URL after executing the changes.
	 * @param forceSameValue If true, execute even when uiValue equals commitValue.
	 *
	 * @returns the value that was executed, which might be different from uiValue,
	 * or undefined in case nothing was executed (no change, cancelled, or failed).
	 */
	readonly execute: (
		uiValue: T | string,
		commitValue: T | string,
		forceImmediate?: boolean,
		skipHistory?: boolean,
		acceptAll?: boolean,
		skipUrlUpdate?: boolean,
		forceSameValue?: boolean,
	) => Promise<T | string | undefined>;

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
	 * Optional: Commit a value as the executed value without executing it,
	 * e.g. by setting the value of an IParameterApi provided by a ShapeDiver
	 * 3D Viewer session, such that the next execution uses it.
	 * @see {@link IShapeDiverParameterActions.setExecutedValue}
	 *
	 * @param value The value to commit.
	 */
	readonly commit?: (value: T | string) => void;

	/**
	 * Definition of the parameter.
	 */
	readonly definition: ShapeDiverResponseParameter;
}
