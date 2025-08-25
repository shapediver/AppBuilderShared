import AppBuilderActionComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionComponent";
import {useParameters} from "@AppBuilderShared/hooks/shapediver/parameters/useParameters";
import React, {useCallback, useMemo} from "react";
import {useShallow} from "zustand/react/shallow";
import {useShapeDiverStoreParameters} from "~/shared/store/useShapeDiverStoreParameters";
import {
	IAppBuilderActionPropsCommon,
	IAppBuilderActionPropsSetParameterValues,
} from "~/shared/types/shapediver/appbuilder";

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
		icon = "tabler:settings",
		tooltip,
		parameterValues,
		namespace,
	} = props;

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

	// Check if any parameter is dirty (has pending changes)
	const isDisabled = parameters.some(({parameter}) => parameter?.state.dirty);

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
