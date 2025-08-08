import AppBuilderActionComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionComponent";
import {useParameter} from "@AppBuilderShared/hooks/shapediver/parameters/useParameter";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import React, {useCallback} from "react";
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
		icon = IconTypeEnum.Settings,
		tooltip,
		parameterValues,
		namespace,
	} = props;

	// Get all parameters that need to be updated
	const parameters = parameterValues.map((paramValue) => {
		const parameter = useParameter<string>({
			namespace: paramValue.parameter.sessionId ?? namespace,
			parameterId: paramValue.parameter.name,
		});
		return {
			parameter,
			value: paramValue.value,
		};
	});

	const {batchParameterValueUpdate} = useShapeDiverStoreParameters(
		useShallow((state) => ({
			batchParameterValueUpdate: state.batchParameterValueUpdate,
		})),
	);

	const onClick = useCallback(async () => {
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
		await batchParameterValueUpdate({
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
