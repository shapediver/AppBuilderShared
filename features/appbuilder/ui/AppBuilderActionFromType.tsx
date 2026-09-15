import {IComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext.types";
import {findAppBuilderActionRegistration} from "@AppBuilderLib/features/appbuilder/config/appBuilderActionRun";
import React from "react";
import {IAppBuilderControlActionRef} from "../config/appbuilder";
import {AppBuilderActionRenderProps} from "./AppBuilderActionBase";
import {sharedAppBuilderActions} from "./sharedAppBuilderActions";

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
		labelSide,
		labelAlign,
	} = options;
	const resolvedToolbarButtonProps = {
		...toolbarButtonProps,
		...(labelSide !== undefined ? {labelSide} : {}),
		...(labelAlign !== undefined ? {labelAlign} : {}),
	};
	if (!actionRef.definition) return null;

	const actionPropsCommon = {
		...actionRef,
		definition: undefined, // avoid passing down the definition again
	};

	const entry = findAppBuilderActionRegistration(
		actionRef.definition,
		sharedAppBuilderActions,
		componentContext.actions,
	);
	if (!entry) return null;
	const Component = entry.component;
	if (!Component) return null;

	return (
		<Component
			key={key}
			namespace={namespace}
			presentation={presentation}
			toolbarButtonProps={resolvedToolbarButtonProps}
			viewportId={viewportId}
			fullscreenId={fullscreenId}
			disabled={disabled}
			{...actionPropsCommon}
			{...actionRef.definition.props}
		/>
	);
}
