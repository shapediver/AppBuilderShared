import {IComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext.types";
import React from "react";
import {
	IAppBuilderControlActionRef,
	isAddToCartAction,
	isCloseConfiguratorAction,
	isCreateModelStateAction,
	isExportParameterValuesAction,
	isImportModelStateAction,
	isImportParameterValuesAction,
	isMessageToParentAction,
	isRedoAction,
	isResetParameterValuesAction,
	isSetBrowserLocationAction,
	isSetParameterValueAction,
	isSetParameterValuesAction,
	isSoundAction,
	isUndoAction,
} from "../config/appbuilder";
import AppBuilderActionAddToCartComponent from "./AppBuilderActionAddToCartComponent";
import {AppBuilderActionRenderProps} from "./AppBuilderActionBase";
import AppBuilderActionCloseConfiguratorComponent from "./AppBuilderActionCloseConfiguratorComponent";
import AppBuilderActionCreateModelStateComponent from "./AppBuilderActionCreateModelStateComponent";
import AppBuilderActionExportParameterValuesComponent from "./AppBuilderActionExportParameterValuesComponent";
import AppBuilderActionImportModelStateComponent from "./AppBuilderActionImportModelStateComponent";
import AppBuilderActionImportParameterValuesComponent from "./AppBuilderActionImportParameterValuesComponent";
import AppBuilderActionMessageToParentComponent from "./AppBuilderActionMessageToParentComponent";
import AppBuilderActionRedoComponent from "./AppBuilderActionRedoComponent";
import AppBuilderActionResetParameterValuesComponent from "./AppBuilderActionResetParameterValuesComponent";
import AppBuilderActionSetBrowserLocationComponent from "./AppBuilderActionSetBrowserLocationComponent";
import AppBuilderActionSetParameterValuesComponent from "./AppBuilderActionSetParameterValuesComponent";
import AppBuilderActionSoundComponent from "./AppBuilderActionSoundComponent";
import AppBuilderActionUndoComponent from "./AppBuilderActionUndoComponent";

interface AppBuilderActionFromTypeOptions extends AppBuilderActionRenderProps {
	viewportId?: string;
	fullscreenId?: string;
}

export function AppBuilderActionFromType(
	actionRef: IAppBuilderControlActionRef,
	namespace: string,
	key: string | number,
	componentContext: IComponentContext,
	options: AppBuilderActionFromTypeOptions = {},
): React.ReactElement | null {
	const {
		presentation,
		toolbarButtonProps,
		viewportId,
		fullscreenId,
		disabled,
	} = options;
	if (!actionRef.definition) return null;

	const actionPropsCommon = {
		...actionRef,
		definition: undefined, // avoid passing down the definition again
	};

	// first we loop through all registered components to see if we can find a match
	// here some of the default actions could be overwritten by custom components
	for (const actionKey in componentContext.actions ?? {}) {
		const componentDefinition = componentContext.actions?.[actionKey];
		if (!componentDefinition) continue;
		if (componentDefinition.isAction(actionRef.definition)) {
			const Component = componentDefinition.component;
			return (
				<Component
					key={actionKey + key}
					namespace={namespace}
					presentation={presentation}
					toolbarButtonProps={toolbarButtonProps}
					viewportId={viewportId}
					fullscreenId={fullscreenId}
					disabled={disabled}
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
				presentation={presentation}
				toolbarButtonProps={toolbarButtonProps}
				disabled={disabled}
				{...actionPropsCommon}
				{...actionRef.definition.props}
			/>
		);
	else if (isAddToCartAction(actionRef.definition))
		return (
			<AppBuilderActionAddToCartComponent
				key={key}
				namespace={namespace}
				presentation={presentation}
				toolbarButtonProps={toolbarButtonProps}
				disabled={disabled}
				{...actionPropsCommon}
				{...actionRef.definition.props}
			/>
		);
	else if (isCloseConfiguratorAction(actionRef.definition))
		return (
			<AppBuilderActionCloseConfiguratorComponent
				key={key}
				presentation={presentation}
				toolbarButtonProps={toolbarButtonProps}
				disabled={disabled}
				{...actionPropsCommon}
				{...actionRef.definition.props}
			/>
		);
	else if (isImportParameterValuesAction(actionRef.definition))
		return (
			<AppBuilderActionImportParameterValuesComponent
				key={key}
				namespace={namespace}
				presentation={presentation}
				toolbarButtonProps={toolbarButtonProps}
				disabled={disabled}
				{...actionPropsCommon}
				{...actionRef.definition.props}
			/>
		);
	else if (isExportParameterValuesAction(actionRef.definition))
		return (
			<AppBuilderActionExportParameterValuesComponent
				key={key}
				namespace={namespace}
				presentation={presentation}
				toolbarButtonProps={toolbarButtonProps}
				disabled={disabled}
				{...actionPropsCommon}
				{...actionRef.definition.props}
			/>
		);
	else if (isImportModelStateAction(actionRef.definition))
		return (
			<AppBuilderActionImportModelStateComponent
				key={key}
				namespace={namespace}
				presentation={presentation}
				toolbarButtonProps={toolbarButtonProps}
				disabled={disabled}
				{...actionPropsCommon}
				{...actionRef.definition.props}
			/>
		);
	else if (isSetParameterValueAction(actionRef.definition))
		return (
			<AppBuilderActionSetParameterValuesComponent
				key={key}
				namespace={namespace}
				presentation={presentation}
				toolbarButtonProps={toolbarButtonProps}
				disabled={disabled}
				{...actionPropsCommon}
				{...actionRef.definition.props}
			/>
		);
	else if (isSetParameterValuesAction(actionRef.definition))
		return (
			<AppBuilderActionSetParameterValuesComponent
				key={key}
				namespace={namespace}
				presentation={presentation}
				toolbarButtonProps={toolbarButtonProps}
				disabled={disabled}
				{...actionPropsCommon}
				{...actionRef.definition.props}
			/>
		);
	else if (isSetBrowserLocationAction(actionRef.definition))
		return (
			<AppBuilderActionSetBrowserLocationComponent
				key={key}
				namespace={namespace}
				presentation={presentation}
				toolbarButtonProps={toolbarButtonProps}
				disabled={disabled}
				{...actionPropsCommon}
				{...actionRef.definition.props}
			/>
		);
	else if (isUndoAction(actionRef.definition))
		return (
			<AppBuilderActionUndoComponent
				key={key}
				namespace={namespace}
				presentation={presentation}
				disabled={disabled}
				toolbarButtonProps={toolbarButtonProps}
				{...actionPropsCommon}
			/>
		);
	else if (isRedoAction(actionRef.definition))
		return (
			<AppBuilderActionRedoComponent
				key={key}
				namespace={namespace}
				presentation={presentation}
				disabled={disabled}
				toolbarButtonProps={toolbarButtonProps}
				{...actionPropsCommon}
			/>
		);
	else if (isResetParameterValuesAction(actionRef.definition))
		return (
			<AppBuilderActionResetParameterValuesComponent
				key={key}
				namespace={namespace}
				presentation={presentation}
				disabled={disabled}
				toolbarButtonProps={toolbarButtonProps}
				{...actionPropsCommon}
			/>
		);
	else if (isSoundAction(actionRef.definition))
		return (
			<AppBuilderActionSoundComponent
				key={key}
				presentation={presentation}
				toolbarButtonProps={toolbarButtonProps}
				disabled={disabled}
				{...actionPropsCommon}
				{...actionRef.definition.props}
			/>
		);
	else if (isMessageToParentAction(actionRef.definition))
		return (
			<AppBuilderActionMessageToParentComponent
				key={key}
				presentation={presentation}
				toolbarButtonProps={toolbarButtonProps}
				disabled={disabled}
				{...actionPropsCommon}
				{...actionRef.definition.props}
			/>
		);
	else return null;
}
