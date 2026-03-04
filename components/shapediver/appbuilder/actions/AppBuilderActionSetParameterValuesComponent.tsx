import AppBuilderActionComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionComponent";
import {useParameters} from "@AppBuilderLib/entities/parameter/model/useParameters";
import {
	ParameterValueDefinition,
	useResolveParameterValues,
} from "@AppBuilderLib/entities/parameter/model/useResolveParameterValues";
import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {useShapeDiverStoreProcessManager} from "@AppBuilderShared/store/useShapeDiverStoreProcessManager";
import {
	IAppBuilderActionPropsCommon,
	IAppBuilderActionPropsSetParameterValues,
	IAppBuilderLegacyActionPropsSetParameterValue,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import {IProcessDefinition} from "@AppBuilderShared/types/store/shapediverStoreProcessManager";
import {Logger} from "@AppBuilderShared/utils/logger";
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

	const [parameterValueSourcesData, setParameterValueSourcesData] = useState<
		ParameterValueDefinition[] | undefined
	>(undefined);

	const parameterValueSourcesDataRef = useRef(parameterValueSourcesData);
	useEffect(() => {
		parameterValueSourcesDataRef.current = parameterValueSourcesData;
	}, [parameterValueSourcesData]);

	const {addProcess, createProcessManager} =
		useShapeDiverStoreProcessManager();

	const resolveMainPromiseRef = useRef<(() => void) | undefined>(undefined);

	const processParameterUpdates = useCallback(
		(sourceResults?: any[]) => {
			let hasChanges = false;
			let sourceIndex = 0;
			const validParameters: {[key: string]: any} = {};

			// First, check if any parameters have changes and validate all values
			for (const {parameter, value, source} of parameters) {
				if (!parameter) {
					Logger.warn("Parameter not found for value:", value);
					continue;
				}

				if (value === undefined && source === undefined) {
					Logger.warn(
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
							Logger.warn(
								`setUiValue failed for parameter ${parameter.definition.id}, the value is not valid.`,
								value,
							);
						}
					}
				} else if (source !== undefined) {
					validParameters[parameter.definition.id] =
						sourceResults?.[sourceIndex++];
					hasChanges = true;
				}
			}

			// If no changes or no valid parameters, return early
			if (!hasChanges || Object.keys(validParameters).length === 0)
				return;

			// Use batch parameter update
			batchParameterValueUpdate({
				[namespace]: validParameters,
			});
		},
		[parameters, namespace, batchParameterValueUpdate],
	);

	const onClick = useCallback(() => {
		// Check if any parameters need source data
		const needsSourceData = parameters.some(
			({source}) => source !== undefined,
		);

		if (needsSourceData) {
			const parameterValueSources: ParameterValueDefinition[] = [];

			for (const {parameter, source} of parameters) {
				if (parameter === undefined || source === undefined) continue;
				// while we could let the useResolveParameterValues hook handle all parameters
				// we only want to pass those with sources to it
				// as otherwise we would have to filter the results again later
				parameterValueSources.push({
					id: parameter.definition.id,
					value: source,
				});
			}

			// create a promise to wait for all sources to be resolved before setting the parameter values
			const mainPromise = new Promise<void>((resolve) => {
				resolveMainPromiseRef.current = resolve;
			});

			const mainProcessDefinition: IProcessDefinition = {
				name: "Set Parameter Values Action - Parameter Values Sources Process",
				promise: mainPromise,
			};

			// we have to await the sources, therefore we create a processManager
			const processManagerId = createProcessManager(props.namespace);
			addProcess(processManagerId, mainProcessDefinition);

			setParameterValueSourcesData(parameterValueSources);
			return;
		}

		// Process parameters without source data
		processParameterUpdates();
	}, [parameters, namespace, processParameterUpdates]);

	const {values: parameterValueSourcesResults, isResolving} =
		useResolveParameterValues({
			namespace,
			parameterValues: parameterValueSourcesData,
		});

	// when parameterValueSourcesData changes, we need to set the parameter value
	useEffect(() => {
		if (
			!parameterValueSourcesDataRef.current ||
			!parameterValueSourcesResults ||
			parameterValueSourcesResults.length === 0 ||
			!parameters
		)
			return;

		// Process parameters with source data
		processParameterUpdates(parameterValueSourcesResults);

		// reset parameterValueSourcesData to avoid re-running this effect
		parameterValueSourcesDataRef.current = undefined;
		setParameterValueSourcesData(undefined);

		// resolve the main promise to indicate that the process is complete
		if (resolveMainPromiseRef.current) {
			resolveMainPromiseRef.current();
			resolveMainPromiseRef.current = undefined;
		}
	}, [parameterValueSourcesResults, processParameterUpdates]);

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
			disabled={isDisabled || isResolving}
		/>
	);
}
