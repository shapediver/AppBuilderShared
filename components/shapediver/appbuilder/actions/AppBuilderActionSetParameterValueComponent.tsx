import AppBuilderActionComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionComponent";
import {useParameter} from "@AppBuilderShared/hooks/shapediver/parameters/useParameter";
import {IAppBuilderLegacyActionPropsSetParameterValue} from "@AppBuilderShared/types/shapediver/appbuilder";
import React, {useCallback} from "react";

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
		namespace: namespaceFromProps,
	} = props;

	// TODO: Implement the action
	const parameter = useParameter<string>({
		namespace: namespace ?? namespaceFromProps,
		parameterId: name,
	});

	const onClick = useCallback(() => {
		if (!parameter?.actions.isUiValueDifferent(value)) return;
		if (parameter.actions.setUiValue(value))
			parameter.actions.execute(true);
		else
			console.warn(
				`setUiValue failed for parameter ${parameter.definition.id}, the value is not valid.`,
				value,
			);
	}, [parameter?.state, parameter?.actions, parameter?.definition, value]);

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
