import AppBuilderActionComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionComponent";
import {useParameter} from "@AppBuilderShared/hooks/shapediver/parameters/useParameter";
import {useParameterValueSources} from "@AppBuilderShared/hooks/shapediver/parameters/useParameterValueSources";
import {
	IAppBuilderLegacyActionPropsSetParameterValue,
	IAppBuilderParameterValueSourceDefinition,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import React, {useCallback, useEffect, useState} from "react";

type Props = IAppBuilderLegacyActionPropsSetParameterValue & {
	namespace: string;
};

/**
 * Functional component for a "setParameterValue" action.
 *
 * @returns
 */
export default function AppBuilderActionSetParameterValueComponent(
	props: Props,
) {
	const {
		label = "Set parameter",
		icon,
		tooltip,
		parameter: {name, sessionId: namespace},
		value,
		source,
		namespace: namespaceFromProps,
	} = props;

	const [sourceData, setSourceData] = useState<
		| {
				namespace: string;
				sources: IAppBuilderParameterValueSourceDefinition[];
		  }
		| undefined
	>(undefined);

	const parameter = useParameter<string>({
		namespace: namespace ?? namespaceFromProps,
		parameterId: name,
	});

	const sourceResults = useParameterValueSources(sourceData);

	const onClick = useCallback(() => {
		if (value === undefined && source) {
			// we need to load the source data first
			setSourceData({
				namespace: namespace ?? namespaceFromProps,
				sources: [source],
			});

			// the actual setting of the parameter value will be done
			// in the useEffect below when sourceData changes
			return;
		}

		if (value === undefined) {
			console.warn(
				`No value or source defined for setting parameter ${parameter?.definition.id}`,
			);
			return;
		}

		if (!parameter?.actions.isUiValueDifferent(value)) return;
		if (parameter.actions.setUiValue(value))
			parameter.actions.execute(true);
		else
			console.warn(
				`setUiValue failed for parameter ${parameter.definition.id}, the value is not valid.`,
				value,
			);
	}, [
		parameter?.state,
		parameter?.actions,
		parameter?.definition,
		value,
		source,
		namespace,
		namespaceFromProps,
		name,
	]);

	// when sourceData changes, we need to set the parameter value
	// this is done here to avoid setting the parameter value
	// before the source data has been loaded
	useEffect(() => {
		if (!sourceData || !parameter) return;

		// we have source data, now we need to get the value from it
		// and set it to the parameter
		// this is done by using the useParameterValueSources hook
		const newValue = sourceResults[0];
		if (!newValue) {
			console.warn(
				`No value found for parameter ${name} in source results.`,
			);
			return;
		}
		if (!parameter.actions.isUiValueDifferent(newValue)) return;
		if (parameter.actions.setUiValue(newValue as string))
			parameter.actions.execute(true);
		else
			console.warn(
				`setUiValue failed for parameter ${parameter.definition.id}, the value is not valid.`,
				newValue,
			);
		// reset sourceData to avoid re-running this effect
		setSourceData(undefined);
	}, [sourceData, sourceResults, name, parameter]);

	return (
		<AppBuilderActionComponent
			label={label}
			icon={icon}
			tooltip={tooltip}
			onClick={onClick}
			disabled={parameter?.state.dirty}
		/>
	);
}
