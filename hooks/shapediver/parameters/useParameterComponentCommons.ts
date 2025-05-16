import {useParameter} from "@AppBuilderShared/hooks/shapediver/parameters/useParameter";
import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {useShapeDiverStoreProcessManager} from "@AppBuilderShared/store/useShapeDiverStoreProcessManager";
import {PropsParameter} from "@AppBuilderShared/types/components/shapediver/propsParameter";
import {IShapeDiverParameterState} from "@AppBuilderShared/types/shapediver/parameter";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {CUSTOM_SESSION_ID_POSTFIX} from "../appbuilder/useAppBuilderCustomParameters";

/**
 * Hook providing functionality common to all parameter components like
 * {@link ParameterSliderComponent}, {@link ParameterStringComponent}, etc.
 * @param props
 * @param debounceTimeoutForImmediateExecution
 * @param initializer
 * @returns
 */
export function useParameterComponentCommons<T>(
	props: PropsParameter,
	debounceTimeoutForImmediateExecution: number = 1000,
	initializer: (
		state: IShapeDiverParameterState<T | string>,
	) => T | string = (state) => state.uiValue,
) {
	const {namespace, disableIfDirty, acceptRejectMode} = props;
	const {definition, actions, state} = useParameter<T | string>(props);
	const executing = useShapeDiverStoreParameters((state) => {
		const ids = state.sessionDependency[namespace];

		return !ids.every((id) => !state.parameterChanges[id]?.executing);
	});
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
	const sessionDependencies = useShapeDiverStoreParameters((state) => {
		return state.sessionDependency[namespace];
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
					}
				},
				timeout === undefined ? debounceTimeout : timeout,
			);
		},
		[acceptRejectMode, debounceTimeout],
	);

	useEffect(() => {
		setValue(state.uiValue);
	}, [state.uiValue]);

	// state for the onCancel callback which can be set from the parameter components
	const [onCancelCallback, setOnCancelCallback] = useState<
		(() => void) | undefined
	>(undefined);

	/**
	 * Provide a possibility to cancel if
	 *   - the component is running in acceptRejectMode and the parameter state is dirty, AND
	 *   - changes are not currently executing
	 */
	const onCancel = useMemo(
		() =>
			acceptRejectMode && state.dirty && !executing
				? () => {
						onCancelCallback?.();
						handleChange(state.execValue, 0);
					}
				: undefined,
		[
			acceptRejectMode,
			state.dirty,
			executing,
			state.execValue,
			onCancelCallback,
		],
	);

	/**
	 * disable the component in case
	 *   - the parameter state is dirty AND we should disable the component if so, OR
	 *   - changes are currently executing
	 *   - there are processes running
	 */
	const disabled =
		(disableIfDirty && state.dirty) || executing || processesInSession;

	const memoizedDefinition = useMemo(() => {
		return {...definition, ...props.overrides};
	}, [definition, props.overrides]);

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
	};
}
