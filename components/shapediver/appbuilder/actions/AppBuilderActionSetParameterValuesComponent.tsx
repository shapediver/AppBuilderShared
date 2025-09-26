import AppBuilderActionComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionComponent";
import {useParameters} from "@AppBuilderShared/hooks/shapediver/parameters/useParameters";
import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {
	IAppBuilderActionPropsCommon,
	IAppBuilderActionPropsSetParameterValues,
	IAppBuilderLegacyActionPropsSetParameterValue,
	IAppBuilderParameterValueSourceDefinition,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useShallow} from "zustand/react/shallow";

type Props = (
	| IAppBuilderActionPropsSetParameterValues
	| IAppBuilderLegacyActionPropsSetParameterValue
) &
	IAppBuilderActionPropsCommon & {
		namespace: string;
	};

/**
 * Functional component for a "setParameterValues" action.
 *
 * @returns
 */
export default function AppBuilderActionSetParameterValuesComponent(
	props: Props,
) {
	const {label = "Set parameters", icon, tooltip, namespace} = props;

	const parameterValues = useMemo(() => {
		if ("parameterValues" in props) {
			return props.parameterValues;
		} else {
			// legacy support for single parameter value
			return [props];
		}
	}, [props]);

	const [isDisabled, setIsDisabled] = useState(true);

	const parameterProps = useMemo(
		() =>
			parameterValues.map((paramValue) => ({
				namespace: paramValue.parameter.sessionId ?? namespace,
				parameterId: paramValue.parameter.name,
			})),
		[parameterValues, namespace],
	);

	const parametersList = useParameters<string>(parameterProps);

	const parameters = useMemo(() => {
		return parametersList.map((parameter, index) => ({
			parameter,
			value: parameterValues[index].value,
			source: parameterValues[index].source,
		}));
	}, [parametersList]);

	const {batchParameterValueUpdate} = useShapeDiverStoreParameters(
		useShallow((state) => ({
			batchParameterValueUpdate: state.batchParameterValueUpdate,
		})),
	);

	const [sourceData, setSourceData] = useState<
		| {
				namespace: string;
				sources: IAppBuilderParameterValueSourceDefinition[];
		  }
		| undefined
	>(undefined);

	const sourceDataRef = useRef(sourceData);

	const onClick = useCallback(() => {
		let hasChanges = false;
		let hasSourceData = false;
		const sources: IAppBuilderParameterValueSourceDefinition[] = [];
		const validParameters: {[key: string]: any} = {};

		// First, check if any parameters have changes and validate all values
		for (const {parameter, value, source} of parameters) {
			if (!parameter) {
				console.warn("Parameter not found for value:", value);
				continue;
			}

			if (value === undefined && source === undefined) {
				console.warn(
					"No value or source defined for parameter:",
					parameter.definition.id,
				);
				continue;
			}

			if (value !== undefined) {
				if (parameter.actions.isUiValueDifferent(value)) {
					hasChanges = true;

					// Pre-validate the value
					if (parameter.actions.setUiValue(value)) {
						validParameters[parameter.definition.id] = value;
					} else {
						console.warn(
							`setUiValue failed for parameter ${parameter.definition.id}, the value is not valid.`,
							value,
						);
					}
				}
			} else if (source !== undefined) {
				hasSourceData = true;
				sources.push(source);
			}
		}

		if (hasSourceData) {
			setSourceData({
				namespace,
				sources,
			});
			// The actual setting of the parameter values will be done
			// in the useEffect below when sourceData changes
			return;
		}

		// If no changes or no valid parameters, return early
		if (!hasChanges || Object.keys(validParameters).length === 0) return;

		// Use batch parameter update
		batchParameterValueUpdate({
			[namespace]: validParameters,
		});
	}, [parameters, namespace]);

	useEffect(() => {
		const {getParameter} = useShapeDiverStoreParameters.getState();

		// Subscribe to each parameter's dirty state
		const unsubscribes = parameterValues.map(
			({parameter: {sessionId, name}}) => {
				const paramNamespace = sessionId ?? namespace;
				const parameterStore = getParameter(paramNamespace, name);

				if (!parameterStore) return () => {};

				// Subscribe to the parameter store's state changes
				return parameterStore.subscribe((state) => {
					// Check if any parameter is dirty
					const anyDirty = parameterValues.some(
						({parameter: {sessionId, name}}) => {
							const ns = sessionId ?? namespace;
							const store = useShapeDiverStoreParameters
								.getState()
								.getParameter(ns, name);
							return store?.getState().state.dirty ?? false;
						},
					);

					setIsDisabled(anyDirty);
				});
			},
		);

		// Initial check
		const initialDirty = parameterValues.some(
			({parameter: {sessionId, name}}) => {
				const ns = sessionId ?? namespace;
				const store = getParameter(ns, name);
				return store?.getState().state.dirty ?? false;
			},
		);
		setIsDisabled(initialDirty);

		return () => {
			unsubscribes.forEach((unsubscribe) => unsubscribe());
		};
	}, [parameterValues, namespace]);

	return (
		<AppBuilderActionComponent
			label={label}
			icon={icon}
			tooltip={tooltip}
			onClick={onClick}
			disabled={isDisabled}
		/>
	);
}
