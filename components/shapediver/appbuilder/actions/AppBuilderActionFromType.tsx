import AppBuilderActionAddToCartComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionAddToCartComponent";
import AppBuilderActionCloseConfiguratorComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionCloseConfiguratorComponent";
import AppBuilderActionCreateModelStateComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionCreateModelStateComponent";
import AppBuilderActionSetBrowserLocationComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionSetBrowserLocationComponent";
import AppBuilderActionSetParameterValuesComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionSetParameterValuesComponent";
import {
	IAppBuilderControlActionRef,
	isAddToCartAction,
	isCameraAction,
	isCloseConfiguratorAction,
	isCreateModelStateAction,
	isSetBrowserLocationAction,
	isSetParameterValueAction,
	isSetParameterValuesAction,
	isSoundAction,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import React from "react";
import AppBuilderActionCameraComponent from "./AppBuilderActionCameraComponent";
import AppBuilderActionSoundComponent from "./AppBuilderActionSoundComponent";

export function AppBuilderActionFromType(
	actionRef: IAppBuilderControlActionRef,
	namespace: string,
	key: string | number,
): React.ReactElement | null {
	const actionPropsCommon = {
		...actionRef,
		definition: undefined, // avoid passing down the definition again
	};
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
	else if (isCameraAction(actionRef.definition))
		return (
			<AppBuilderActionCameraComponent
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
	else return null;
}
