import {CUSTOM_SESSION_ID_POSTFIX} from "@AppBuilderLib/features/appbuilder/model/useAppBuilderCustomParameters";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {useShapeDiverStoreProcessManager} from "@AppBuilderLib/shared/model/useShapeDiverStoreProcessManager";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useShallow} from "zustand/react/shallow";
import {IShapeDiverParameterState} from "../config/parameter";
import {
	PropsParameterComponent,
	PropsParameterWithForm,
} from "../config/propsParameter";
import {parameterChangeScheduler} from "./parameterChangeScheduler";
import {useParameter} from "./useParameter";
import {useShapeDiverStoreParameters} from "./useShapeDiverStoreParameters";

import {applyOverrides} from "@AppBuilderLib/lib/mergeOverrides";

/**
 * Hook providing functionality common to all parameter components like
 * {@link ParameterSliderComponent}, {@link ParameterStringComponent}, etc.
 * Optionally accepts a form instance for Mantine form integration.
 * @param props - Parameter props, optionally including form instance
 * @param debounceTimeoutForImmediateExecution
 * @param initializer
 * @param disableWhileDirty Whether a dirty draft disables its own control.
 * @returns Common parameter functionality including optional form instance
 */
export function useParameterComponentCommons<T>(
	props: PropsParameterComponent,
	debounceTimeoutForImmediateExecution: number = 1000,
	initializer: (
		state: IShapeDiverParameterState<T | string>,
	) => T | string = (state) => state.uiValue,
	disableWhileDirty = true,
) {
	const formFromProps = (props as PropsParameterWithForm).form;
	const debounceTimeoutForExecution = formFromProps
		? 0
		: debounceTimeoutForImmediateExecution;

	const {
		namespace,
		delegates = [],
		disableIfDirty,
		acceptRejectMode: propAcceptRejectMode,
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

	// Note: A reset value defined by the overrides of the parameter reference is
	// registered with the parameter store from the App Builder data, independent
	// of the rendered components (see useAppBuilderResetValueOverrides).

	// Read acceptRejectMode from the store as a fallback.
	// The prop may be undefined if the component renders before the store is populated
	// (accept-reject mode is stored per-parameter in the session's parameter store).
	const storeAcceptRejectMode = useShapeDiverStoreParameters((state) => {
		const paramStore = state.getParameter(
			namespace,
			definition?.id ?? props.parameterId,
		);
		if (!paramStore) return undefined;
		return paramStore.getState().acceptRejectMode;
	});

	const acceptRejectMode = propAcceptRejectMode ?? storeAcceptRejectMode;

	const {executing, sessionDependencies} = useShapeDiverStoreParameters(
		useShallow((state) => {
			const sessionDependencies = state.sessionDependency[namespace];

			return {
				executing: !sessionDependencies.every(
					(id) => !state.parameterChanges[id]?.executing,
				),
				sessionDependencies,
			};
		}),
	);

	const disabledByParameter = useShapeDiverStoreParameters((state) =>
		state.isAnyParameterDisablingOthers(definition.id),
	);

	const delegatesExecuting = useShapeDiverStoreParameters((state) =>
		delegates.some(
			({namespace: delegateNamespace}) =>
				state.parameterChanges[delegateNamespace]?.executing ?? false,
		),
	);
	const delegateStores = useShapeDiverStoreParameters(
		useShallow((store) =>
			delegates.map(({namespace: delegateNamespace, parameterId}) =>
				store.getParameter(delegateNamespace, parameterId),
			),
		),
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
	// a change still waiting to be sent (the component was unmounted and
	// mounted again, e.g. its container was closed) is shown
	const [value, setValue] = useState(() =>
		parameterChangeScheduler.isPending(namespace, definition.id)
			? (parameterChangeScheduler.pendingValue(
					namespace,
					definition.id,
				) as T | string)
			: initializer(state),
	);

	const debounceTimeout = acceptRejectMode ? 0 : debounceTimeoutForExecution;
	// Changes are sent by the scheduler, together with the pending changes of
	// all other parameters. Exceptions, which use a timeout of their own:
	// accept/reject mode (the change waits for the confirmation of the user),
	// and components whose values are not executed by the parameter store
	// (e.g. the form widget).
	const scheduled = !acceptRejectMode && !props.customActions?.execute;
	const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
	const delegatesInitializedRef = useRef(false);
	const clearDebounceTimer = useCallback(() => {
		clearTimeout(debounceRef.current);
		debounceRef.current = undefined;
	}, []);

	// a scheduled change survives an unmount of the component (e.g. the
	// container of the parameter closes)
	useEffect(() => clearDebounceTimer, [clearDebounceTimer]);

	/** Drop the change of this parameter which waits to be sent. */
	const cancelPendingChange = useCallback(() => {
		clearDebounceTimer();
		parameterChangeScheduler.cancel(namespace, definition.id);
	}, [clearDebounceTimer, namespace, definition.id]);

	const executeDelegates = useCallback(
		(value: T | string, forceImmediate: boolean, forceSameValue = false) =>
			delegates.flatMap(({namespace: delegateNamespace, parameterId}) => {
				const delegate = useShapeDiverStoreParameters
					.getState()
					.getParameter(delegateNamespace, parameterId);
				if (!delegate) {
					Logger.warn(
						`Delegate parameter ${parameterId} does not exist for session namespace ${delegateNamespace}.`,
					);
					return [];
				}

				const delegateActions = delegate.getState().actions;
				let delegateValue = value;
				let valueWasSet = delegateActions.setUiValue(delegateValue);
				if (!valueWasSet) {
					delegateValue = actions.stringify?.(value) ?? `${value}`;
					valueWasSet = delegateActions.setUiValue(delegateValue);
				}
				if (!valueWasSet) {
					Logger.warn(
						`setUiValue failed for delegate parameter ${parameterId}.`,
						delegateValue,
					);
					return [];
				}

				return [
					delegateActions.execute(
						forceImmediate,
						undefined,
						undefined,
						undefined,
						forceSameValue,
					),
				];
			}),
		[actions, delegates],
	);

	useEffect(() => {
		if (delegatesInitializedRef.current || delegates.length === 0) return;
		if (delegateStores.some((delegate) => !delegate)) return;

		delegatesInitializedRef.current = true;
		void Promise.all(executeDelegates(state.commitValue, true));
	}, [delegateStores, delegates.length, executeDelegates, state.commitValue]);

	/**
	 * Send a change once the timeout elapsed without a further change (of any
	 * parameter, see {@link parameterChangeScheduler}), a timeout of 0 sends
	 * it right away, together with the pending changes of all parameters.
	 */
	const handleChange = useCallback(
		(
			curval: T | string,
			timeout?: number,
			cb: () => void = () => {},
			forceSameValue = false,
		) => {
			clearDebounceTimer();
			setValue(curval);
			if (scheduled) {
				parameterChangeScheduler.schedule({
					namespace,
					parameterId: definition.id,
					value: curval,
					timeout: timeout === undefined ? debounceTimeout : timeout,
					forceSameValue,
					onSend:
						delegates.length > 0
							? () =>
									Promise.all(
										executeDelegates(
											curval,
											true,
											forceSameValue,
										),
									)
							: undefined,
					onSent: cb,
					// A restored state or a value of another request replaced the
					// change (e.g. undo): show the committed value again. It is
					// committed again (a new commit revision), so that components
					// which applied the change to the scene restore it (e.g. a
					// gizmo following its committed value), also an instance
					// mounted again meanwhile. While an execution of the session
					// runs, the value is shown at its end (a commit now would
					// replace the value being executed).
					onDiscard: () => {
						const store = useShapeDiverStoreParameters.getState();
						const parameter = store.getParameter(
							namespace,
							definition.id,
						);
						if (!parameter) return;
						const {state, actions} = parameter.getState();
						if (store.parameterChanges[namespace]?.executing)
							actions.resetToCommitValue();
						else actions.setCommittedValue(state.commitValue);
						setValue(state.commitValue as T | string);
					},
				});
				return;
			}
			debounceRef.current = setTimeout(
				() => {
					debounceRef.current = undefined;
					if (actions.setUiValue(curval)) {
						Promise.all([
							actions.execute(
								!acceptRejectMode,
								undefined,
								undefined,
								undefined,
								forceSameValue,
							),
							...executeDelegates(
								curval,
								!acceptRejectMode,
								forceSameValue,
							),
						]).then(() => cb());
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
		[
			acceptRejectMode,
			debounceTimeout,
			actions,
			clearDebounceTimer,
			definition,
			delegates.length,
			executeDelegates,
			namespace,
			scheduled,
		],
	);

	/** Whether a change of this parameter waits to be sent by the scheduler. */
	const isScheduledChangePending = useCallback(
		() => parameterChangeScheduler.isPending(namespace, definition.id),
		[namespace, definition.id],
	);

	useEffect(() => {
		// a change waiting to be sent is shown (e.g. after the component was
		// mounted again), the store does not know it yet
		if (parameterChangeScheduler.isPending(namespace, definition.id))
			return;
		if (reactive) {
			setValue(state.uiValue);
		}
		// a commit (e.g. of a discarded change) shows the committed value, also
		// when the ui value did not change
	}, [state.uiValue, state.commitRevision, reactive]);

	useEffect(() => {
		// The end of an execution shows the value of the store: a change
		// discarded during the execution (e.g. undo) changed neither the ui
		// value nor the commit revision, and an instance mounted again after
		// the change was scheduled was not reached by its discard callback.
		// (a local change of a component with a timeout of its own, see
		// debounceRef, is not in the store yet)
		if (executing || !reactive || debounceRef.current) return;
		if (parameterChangeScheduler.isPending(namespace, definition.id))
			return;
		setValue(state.uiValue);
	}, [executing]);

	useEffect(() => {
		if (!reactive) {
			setValue(customValue);
		}
	}, [customValue, reactive]);

	// state for the onCancel callback which can be set from the parameter components
	const [onCancelCallback, setOnCancelCallback] = useState<
		(() => void) | undefined
	>(undefined);

	// Track previous dirty/commitValue to detect cancellation vs acceptance
	const prevDirtyRef = useRef(state.dirty);
	const prevCommitValueRef = useRef(state.commitValue);

	useEffect(() => {
		const wasDirty = prevDirtyRef.current;
		const prevCommitValue = prevCommitValueRef.current;
		prevDirtyRef.current = state.dirty;
		prevCommitValueRef.current = state.commitValue;

		// dirty true→false with commitValue unchanged = cancelled (X-icon or global Reject)
		// dirty true→false with commitValue changed = accepted
		if (
			wasDirty &&
			!state.dirty &&
			acceptRejectMode &&
			state.commitValue === prevCommitValue
		) {
			onCancelCallback?.();
		}
	}, [state.dirty, state.commitValue, acceptRejectMode, onCancelCallback]);

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
						handleChange(state.commitValue, 0);
					}
				: undefined,
		[
			acceptRejectMode,
			state.dirty,
			executing,
			state.commitValue,
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
		(disableWhileDirty && disableIfDirty && state.dirty) ||
		executing ||
		delegatesExecuting ||
		processesInSession ||
		disabledByParameter;

	/**
	 * Whether a computation runs (busy mode): editing is paused, e.g. the
	 * interaction tools in the viewport ignore presses.
	 */
	const busy = executing || delegatesExecuting || processesInSession;

	const memoizedDefinition = useMemo(() => {
		return applyOverrides(definition, props.overrides);
	}, [definition, props.overrides]);

	const showReset = memoizedDefinition.settings?.resettable === true;

	const resetToDefault = useCallback(
		() => handleChange(memoizedDefinition.defval!, 0),
		[handleChange, memoizedDefinition.defval],
	);

	// Extract form from props if provided
	const form = formFromProps;
	const fieldError =
		form && definition ? form.errors[definition.id] : undefined;

	// Get form input props once if form is available
	const formInputProps = useMemo(() => {
		if (!form || !definition) return null;
		return form.getInputProps(definition.id);
	}, [form, definition, fieldError]);

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
		cancelPendingChange,
		isScheduledChangePending,
		setOnCancelCallback,
		onCancel,
		disabled,
		showReset,
		resetToDefault,
		sessionDependencies,
		executing,
		busy,
		// Form instance (optional)
		form,
		formInputProps,
		formKey,
	};
}
