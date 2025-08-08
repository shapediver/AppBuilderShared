import {AppBuilderActionFromType} from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionFromType";
import ParametersAndExportsAccordionComponent from "@AppBuilderShared/components/shapediver/ui/ParametersAndExportsAccordionComponent";
import {AppBuilderContainerContext} from "@AppBuilderShared/context/AppBuilderContext";
import {PropsExport} from "@AppBuilderShared/types/components/shapediver/propsExport";
import {PropsParameter} from "@AppBuilderShared/types/components/shapediver/propsParameter";
import {
	IAppBuilderControlActionRef,
	IAppBuilderControlExportRef,
	IAppBuilderControlParameterRef,
	IAppBuilderWidgetPropsControls,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import {Group, Paper, Stack} from "@mantine/core";
import React, {useContext, useMemo} from "react";
type Props = IAppBuilderWidgetPropsControls & {
	namespace: string;
};

export default function AppBuilderControlsWidgetComponent(props: Props) {
	const {controls = [], namespace} = props;
	const context = useContext(AppBuilderContainerContext);
	// Convert parameter and export references to component props
	const parameterProps: PropsParameter[] = useMemo(
		() =>
			controls
				.filter((control) => control.type === "parameter")
				.map((control) => {
					const p = control.props as IAppBuilderControlParameterRef;
					return {
						namespace: p.sessionId ?? namespace,
						parameterId: p.name,
						disableIfDirty: p.disableIfDirty,
						acceptRejectMode: p.acceptRejectMode,
						overrides: p.overrides,
					};
				}),
		[controls, namespace],
	);

	const exportProps: PropsExport[] = useMemo(
		() =>
			controls
				.filter((control) => control.type === "export")
				.map((control) => {
					const p = control.props as IAppBuilderControlExportRef;
					return {
						namespace: p.sessionId ?? namespace,
						exportId: p.name,
						overrides: p.overrides,
					};
				}),
		[controls, namespace],
	);

	// Create action components
	const actionComponents = useMemo(
		() =>
			controls
				.filter((control) => control.type === "action")
				.map((control, i) => {
					const action = (
						control.props as IAppBuilderControlActionRef
					).definition;

					return AppBuilderActionFromType(action, namespace, i);
				}),
		[controls, namespace],
	);

	// Check if we have any content to render
	const hasParameters = parameterProps.length > 0;
	const hasExports = exportProps.length > 0;
	const hasActions = actionComponents.length > 0;

	if (!hasParameters && !hasExports && !hasActions) {
		return <></>;
	}

	// Create the components array
	const components = [];

	// Add parameters and exports component if we have any
	if (hasParameters || hasExports) {
		components.push(
			<ParametersAndExportsAccordionComponent
				key="parameters-exports"
				parameters={parameterProps}
				exports={exportProps}
			/>,
		);
	}

	// Add action components
	if (hasActions) {
		if (actionComponents.length === 1) {
			components.push(actionComponents[0]);
		} else {
			components.push(
				<Paper key="actions">
					{context.orientation === "vertical" ? (
						<Stack>{actionComponents}</Stack>
					) : (
						<Group>{actionComponents}</Group>
					)}
				</Paper>,
			);
		}
	}

	// If we only have one component, return it directly
	if (components.length === 1) {
		return components[0];
	}

	// Return all components in a container
	return (
		<Paper>
			{context.orientation === "vertical" ? (
				<Stack>{components}</Stack>
			) : (
				<Group>{components}</Group>
			)}
		</Paper>
	);
}
