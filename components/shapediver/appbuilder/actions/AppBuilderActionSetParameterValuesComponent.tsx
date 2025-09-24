import AppBuilderActionComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionComponent";
import {useParameters} from "@AppBuilderShared/hooks/shapediver/parameters/useParameters";
import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {
	IAppBuilderActionPropsCommon,
	IAppBuilderActionPropsSetParameterValues,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import React, {useCallback, useEffect, useMemo, useState} from "react";
import {useShallow} from "zustand/react/shallow";

type Props = IAppBuilderActionPropsSetParameterValues &
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
	const {
		label = "Set parameters",
		icon,
		tooltip,
		parameterValues,
		namespace,
	} = props;

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
		}));
	}, [parametersList]);

	const {batchParameterValueUpdate} = useShapeDiverStoreParameters(
		useShallow((state) => ({
			batchParameterValueUpdate: state.batchParameterValueUpdate,
		})),
	);

	const onClick = useCallback(() => {
		let hasChanges = false;
		const validParameters: {[key: string]: any} = {};

		// First, check if any parameters have changes and validate all values
		for (const {parameter, value} of parameters) {
			if (!parameter) {
				console.warn("Parameter not found for value:", value);
				continue;
			}

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
