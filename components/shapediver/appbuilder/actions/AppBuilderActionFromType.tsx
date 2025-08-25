import AppBuilderActionAddToCartComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionAddToCartComponent";
import AppBuilderActionCloseConfiguratorComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionCloseConfiguratorComponent";
import AppBuilderActionCreateModelStateComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionCreateModelStateComponent";
import AppBuilderActionSetBrowserLocationComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionSetBrowserLocationComponent";
import AppBuilderActionSetParameterValueComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionSetParameterValueComponent";
import AppBuilderActionSetParameterValuesComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionSetParameterValuesComponent";
import {
	IAppBuilderActionDefinition,
	isAddToCartAction,
	isCloseConfiguratorAction,
	isCreateModelStateAction,
	isSetBrowserLocationAction,
	isSetParameterValueAction,
	isSetParameterValuesAction,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import React from "react";

export function AppBuilderActionFromType(
	action: IAppBuilderActionDefinition,
	namespace: string,
	key: string | number,
): React.ReactElement | null {
	if (isCreateModelStateAction(action))
		return (
			<AppBuilderActionCreateModelStateComponent
				key={key}
				namespace={namespace}
				{...action.props}
			/>
		);
	else if (isAddToCartAction(action))
		return (
			<AppBuilderActionAddToCartComponent
				key={key}
				namespace={namespace}
				{...action.props}
			/>
		);
	else if (isCloseConfiguratorAction(action))
		return (
			<AppBuilderActionCloseConfiguratorComponent
				key={key}
				{...action.props}
			/>
		);
	else if (isSetParameterValueAction(action))
		return (
			<AppBuilderActionSetParameterValueComponent
				key={key}
				namespace={namespace}
				{...action.props}
			/>
		);
	else if (isSetParameterValuesAction(action))
		return (
			<AppBuilderActionSetParameterValuesComponent
				key={key}
				namespace={namespace}
				{...action.props}
			/>
		);
	else if (isSetBrowserLocationAction(action))
		return (
			<AppBuilderActionSetBrowserLocationComponent
				key={key}
				namespace={namespace}
				{...action.props}
			/>
		);
	else return null;
}
