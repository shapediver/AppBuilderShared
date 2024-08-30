import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PropsParameter } from "../../../types/components/shapediver/propsParameter";
import { useParameter } from "./useParameter";
import { IShapeDiverParameterState } from "../../../types/shapediver/parameter";
import { useShapeDiverStoreParameters } from "../../../store/useShapeDiverStoreParameters";

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
	initializer: (state: IShapeDiverParameterState<T|string>) => T|string = (state) => state.uiValue,
) {
	const { sessionId, disableIfDirty, acceptRejectMode } = props;
	const { definition, actions, state } = useParameter<T|string>(props);
	const changes = useShapeDiverStoreParameters(state => state.parameterChanges[sessionId]);
	const [value, setValue] = useState(initializer(state));

	const debounceTimeout = acceptRejectMode ? 0 : debounceTimeoutForImmediateExecution;
	const debounceRef = useRef<NodeJS.Timeout>();

	const handleChange = useCallback( (curval : T|string, timeout? : number) => {
		clearTimeout(debounceRef.current);
		setValue(curval);
		debounceRef.current = setTimeout(() => {
			if (actions.setUiValue(curval)) {
				actions.execute(!acceptRejectMode);
			}
		}, timeout === undefined ? debounceTimeout : timeout);
	}, [acceptRejectMode, debounceTimeout]);

	useEffect(() => {
		setValue(state.uiValue);
	}, [state.uiValue]);

	/**
	 * Provide a possibility to cancel if
	 *   - the component is running in acceptRejectMode and the parameter state is dirty, AND
	 *   - changes are not currently executing
	 */
	const onCancel = useMemo( () => acceptRejectMode && state.dirty && !changes?.executing ? 
		() => handleChange(state.execValue, 0) : undefined,
	[acceptRejectMode, state.dirty, changes?.executing, state.execValue] );

	/** 
	 * disable the component in case 
	 *   - the parameter state is dirty AND we should disable the component if so, OR
	 *   - changes are currently executing
	 */
	const disabled = (disableIfDirty && state.dirty) || changes?.executing;

	const memoizedDefinition = useMemo(() => {
		return { ...definition, ...props.overrides };
	}, [definition, props.overrides]);

	return {
		definition: memoizedDefinition,
		actions,
		state,
		value,
		setValue,
		handleChange,
		onCancel,
		disabled
	};
}
