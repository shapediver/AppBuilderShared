import React, { useCallback } from "react";
import { IAppBuilderActionPropsSetParameterValue } from "../../../../types/shapediver/appbuilder";
import AppBuilderActionComponent from "./AppBuilderActionComponent";
import { useParameterStateless } from "../../../../hooks/shapediver/parameters/useParameterStateless";

type Props = IAppBuilderActionPropsSetParameterValue & {
	namespace: string;
};



/**
 * Functional component for a "setParameterValue" action.
 *
 * @returns
 */
export default function AppBuilderActionSetParameterValueComponent(props: Props) {
	
	const { 
		label = "Set parameter", 
		icon, 
		tooltip,
		parameter: { name, sessionId: namespace },
		value,
		namespace: namespaceFromProps,
	} = props;

	// TODO: Implement the action
	const parameter = useParameterStateless<string>(namespace ?? namespaceFromProps, name);

	const onClick = useCallback(() => {
		if (!parameter?.actions.isUiValueDifferent(value))
			return;
		if (parameter?.actions.setUiValue(value))
			parameter.actions.execute(true);
	}, [parameter?.state, parameter?.actions, value]);

	return <AppBuilderActionComponent 
		label={label}
		icon={icon}
		tooltip={tooltip}
		onClick={onClick}
		disabled={parameter?.state.dirty}
	/>;
}