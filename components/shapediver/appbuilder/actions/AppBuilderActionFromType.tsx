import {ComponentContext} from "@AppBuilderLib/shared/lib/ComponentContext";
import AppBuilderActionAddToCartComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionAddToCartComponent";
import AppBuilderActionCloseConfiguratorComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionCloseConfiguratorComponent";
import AppBuilderActionCreateModelStateComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionCreateModelStateComponent";
import AppBuilderActionSetBrowserLocationComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionSetBrowserLocationComponent";
import AppBuilderActionSetParameterValuesComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionSetParameterValuesComponent";
import {
	IAppBuilderControlActionRef,
	isAddToCartAction,
	isCloseConfiguratorAction,
	isCreateModelStateAction,
	isMessageToParentAction,
	isSetBrowserLocationAction,
	isSetParameterValueAction,
	isSetParameterValuesAction,
	isSoundAction,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import React from "react";
import AppBuilderActionMessageToParentComponent from "./AppBuilderActionMessageToParentComponent";
import AppBuilderActionSoundComponent from "./AppBuilderActionSoundComponent";
import { IComponentContext } from "@AppBuilderShared/types/context/componentcontext";

export function AppBuilderActionFromType(
	actionRef: IAppBuilderControlActionRef,
	namespace: string,
	key: string | number,
	componentContext: IComponentContext,
): React.ReactElement | null {
	const actionPropsCommon = {
		...actionRef,
		definition: undefined, // avoid passing down the definition again
	};

	// first we loop through all registered components to see if we can find a match
	// here some of the default actions could be overwritten by custom components
	for (const key in componentContext.actions) {
		const componentDefinition = componentContext.actions[key];
		if (componentDefinition.isAction(actionRef.definition)) {
			const Component = componentDefinition.component;
			return (
				<Component
					key={key}
					namespace={namespace}
					{...actionPropsCommon}
					{...actionRef.definition.props}
				/>
			);
		}
	}

	if (isCreateModelStateAction(actionRef.definition))
		return (
			<AppBuilderActionCreateModelStateComponent
				key={key}
				namespace={namespace}
				{...actionPropsCommon}
				{...actionRef.definition.props}
			/>
		);
	else if (isAddToCartAction(actionRef.definition))
		return (
			<AppBuilderActionAddToCartComponent
				key={key}
				namespace={namespace}
				{...actionPropsCommon}
				{...actionRef.definition.props}
			/>
		);
	else if (isCloseConfiguratorAction(actionRef.definition))
		return (
			<AppBuilderActionCloseConfiguratorComponent
				key={key}
				{...actionPropsCommon}
				{...actionRef.definition.props}
			/>
		);
	else if (isSetParameterValueAction(actionRef.definition))
		return (
			<AppBuilderActionSetParameterValuesComponent
				key={key}
				namespace={namespace}
				{...actionPropsCommon}
				{...actionRef.definition.props}
			/>
		);
	else if (isSetParameterValuesAction(actionRef.definition))
		return (
			<AppBuilderActionSetParameterValuesComponent
				key={key}
				namespace={namespace}
				{...actionPropsCommon}
				{...actionRef.definition.props}
			/>
		);
	else if (isSetBrowserLocationAction(actionRef.definition))
		return (
			<AppBuilderActionSetBrowserLocationComponent
				key={key}
				namespace={namespace}
				{...actionPropsCommon}
				{...actionRef.definition.props}
			/>
		);
	else if (isSoundAction(actionRef.definition))
		return (
			<AppBuilderActionSoundComponent
				key={key}
				{...actionPropsCommon}
				{...actionRef.definition.props}
			/>
		);
	else if (isMessageToParentAction(actionRef.definition))
		return (
			<AppBuilderActionMessageToParentComponent
				key={key}
				{...actionPropsCommon}
				{...actionRef.definition.props}
			/>
		);
	else return null;
}
