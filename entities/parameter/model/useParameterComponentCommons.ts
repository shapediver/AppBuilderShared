import {
	IShapeDiverParameterState,
} from "../config/parameter";
import {
	PropsParameterComponent,
	PropsParameterWithForm,
} from "../config/propsParameter";
import {useParameter} from "./useParameter";
import {CUSTOM_SESSION_ID_POSTFIX} from "@AppBuilderLib/features/appbuilder";
import {Logger} from "@AppBuilderLib/shared/lib";
import {useShapeDiverStoreProcessManager} from "@AppBuilderLib/shared/model";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useShapeDiverStoreParameters} from "./useShapeDiverStoreParameters";

/**
 * Hook providing functionality common to all parameter components like
 * {@link ParameterSliderComponent}, {@link ParameterStringComponent}, etc.
 * Optionally accepts a form instance for Mantine form integration.
 * @param props - Parameter props, optionally including form instance
 * @param debounceTimeoutForImmediateExecution
 * @param initializer
 * @returns Common parameter functionality including optional form instance
 */
export function useParameterComponentCommons<T>(
	props: PropsParameterComponent,
	debounceTimeoutForImmediateExecution: number = 1000,
	initializer: (
		state: IShapeDiverParameterState<T | string>,
	) => T | string = (state) => state.uiValue,
) {
	const {
		namespace,
		disableIfDirty,
		acceptRejectMode,
		reactive = true,
		value: customValue,
	} = props;
	const {
		definition,
		actions: paramActions,
		state,
	} = useParameter<T | string>(props);
	const customActions = props.customActions || {};
	const actions = {...paramActions, ...customActions};
	const {executing, sessionDependencies} = useShapeDiverStoreParameters(
		(state) => {
			const sessionDependencies = state.sessionDependency[namespace];

			return {
				executing: !sessionDependencies.every(
					(id) => !state.parameterChanges[id]?.executing,
				),
				sessionDependencies,
			};
		},
	);

	const disabledByParameter = useShapeDiverStoreParameters((state) =>
		state.isAnyParameterDisablingOthers(definition.id),
	);

	const processesInSession = useShapeDiverStoreProcessManager((state) => {
		// check if there are currently processes running in the session
		return (
			Object.values(state.processManagers).filter((p) => {
				// check if it is the same namespace as the current session
				if (p.controllerSessionId === namespace) return true;

				// check if the postfix was used on the controllerSessionId
				if (
					p.controllerSessionId.endsWith(CUSTOM_SESSION_ID_POSTFIX) &&
					p.controllerSessionId ===
						namespace + CUSTOM_SESSION_ID_POSTFIX
				)
					return true;

				// check if the postfix was used on the namespace
				if (
					namespace.endsWith(CUSTOM_SESSION_ID_POSTFIX) &&
					p.controllerSessionId ===
						namespace.substring(
							0,
							namespace.length - CUSTOM_SESSION_ID_POSTFIX.length,
						)
				)
					return true;

				return false;
			}).length > 0
		);
	});
	const [value, setValue] = useState(initializer(state));

	const debounceTimeout = acceptRejectMode
		? 0
		: debounceTimeoutForImmediateExecution;
	const debounceRef = useRef<NodeJS.Timeout>();

	const handleChange = useCallback(
		(curval: T | string, timeout?: number, cb: () => void = () => {}) => {
			clearTimeout(debounceRef.current);
			setValue(curval);
			debounceRef.current = setTimeout(
				() => {
					if (actions.setUiValue(curval)) {
						actions.execute(!acceptRejectMode).then(() => cb());
					} else {
						Logger.warn(
							`setUiValue failed for parameter ${definition.id}, the value is not valid.`,
							curval,
						);
					}
				},
				timeout === undefined ? debounceTimeout : timeout,
			);
		},
		[acceptRejectMode, debounceTimeout, actions, definition],
	);

	useEffect(() => {
		if (reactive) {
			setValue(state.uiValue);
		}
	}, [state.uiValue, reactive]);

	useEffect(() => {
		if (!reactive) {
			setValue(customValue);
		}
	}, [customValue, reactive]);

	// state for the onCancel callback which can be set from the parameter components
	const [onCancelCallback, setOnCancelCallback] = useState<
		(() => void) | undefined
	>(undefined);

	// Track previous dirty/execValue to detect cancellation vs acceptance
	const prevDirtyRef = useRef(state.dirty);
	const prevExecValueRef = useRef(state.execValue);

	useEffect(() => {
		const wasDirty = prevDirtyRef.current;
		const prevExecValue = prevExecValueRef.current;
		prevDirtyRef.current = state.dirty;
		prevExecValueRef.current = state.execValue;

		// dirty true→false with execValue unchanged = cancelled (X-icon or global Reject)
		// dirty true→false with execValue changed = accepted
		if (
			wasDirty &&
			!state.dirty &&
			acceptRejectMode &&
			state.execValue === prevExecValue
		) {
			onCancelCallback?.();
		}
	}, [state.dirty, state.execValue, acceptRejectMode, onCancelCallback]);

	/**
	 * Provide a possibility to cancel if
	 *   - the component is running in acceptRejectMode and the parameter state is dirty, AND
	 *   - changes are not currently executing
	 *
	 * This cancellation is only done via the X icon in the parameter component,
	 * global cancellation via the Reject button will trigger the onCancelCallback via the useEffect above.
	 */
	const onCancel = useMemo(
		() =>
			acceptRejectMode && state.dirty && !executing
				? () => {
						handleChange(state.execValue, 0);
					}
				: undefined,
		[
			acceptRejectMode,
			state.dirty,
			executing,
			state.execValue,
			handleChange,
		],
	);

	/**
	 * disable the component in case
	 *   - the parameter state is dirty AND we should disable the component if so, OR
	 *   - changes are currently executing
	 *   - there are processes running
	 *   - the parameter is disabled by another parameter (e.g. interaction parameters disable other parameters when active)
	 */
	const disabled =
		(disableIfDirty && state.dirty) ||
		executing ||
		processesInSession ||
		disabledByParameter;

	const memoizedDefinition = useMemo(() => {
		return {...definition, ...props.overrides};
	}, [definition, props.overrides]);

	// Extract form from props if provided
	const form = (props as PropsParameterWithForm).form;

	// Get form input props once if form is available
	const formInputProps = useMemo(() => {
		if (!form || !definition) return null;
		return form.getInputProps(definition.id);
	}, [form, definition]);

	const formKey = useMemo(() => {
		if (!form || !definition) return null;
		return form.key(definition.id);
	}, [form, definition]);

	return {
		definition: memoizedDefinition,
		actions,
		state,
		value,
		setValue,
		handleChange,
		setOnCancelCallback,
		onCancel,
		disabled,
		sessionDependencies,
		// Form instance (optional)
		form,
		formInputProps,
		formKey,
	};
}
