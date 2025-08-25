import {AppBuilderActionFromType} from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionFromType";
import {ComponentContext} from "@AppBuilderShared/context/ComponentContext";
import {useExports} from "@AppBuilderShared/hooks/shapediver/parameters/useExports";
import {useParameters} from "@AppBuilderShared/hooks/shapediver/parameters/useParameters";
import {
	getExportComponent,
	getParameterComponent,
} from "@AppBuilderShared/types/components/shapediver/componentTypes";
import {PropsParameter} from "@AppBuilderShared/types/components/shapediver/propsParameter";
import {
	IAppBuilderControlActionRef,
	IAppBuilderControlExportRef,
	IAppBuilderControlParameterRef,
	IAppBuilderWidgetPropsControls,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import {Paper, Stack} from "@mantine/core";
import React, {ReactElement, useContext, useMemo} from "react";
type Props = IAppBuilderWidgetPropsControls & {
	namespace: string;
};

export default function AppBuilderControlsWidgetComponent(props: Props) {
	const {controls = [], namespace} = props;
	const componentContext = useContext(ComponentContext);

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

	const exportProps = useMemo(
		() => ({
			namespace,
			exports: controls
				.filter((control) => control.type === "export")
				.map((control) => {
					const p = control.props as IAppBuilderControlExportRef;
					return {
						exportId: p.name,
						overrides: p.overrides,
					};
				}),
		}),
		[controls, namespace],
	);

	// Get parameters and exports separately
	const parameters = useParameters(parameterProps);
	const exports = useExports(exportProps);

	// Create parameter map for quick lookup
	const parameterMap = useMemo(() => {
		const map = new Map<string, ReactElement>();
		parameters.forEach((param, index) => {
			const {component: ParameterComponent, extraBottomPadding} =
				getParameterComponent(componentContext, param.definition);

			map.set(
				parameterProps[index].parameterId,
				<ParameterComponent
					key={param.definition.id}
					{...parameterProps[index]}
					wrapperComponent={Paper}
					wrapperProps={{
						shadow: "none",
						pb: extraBottomPadding ? "md" : undefined,
					}}
					disableIfDirty={
						parameterProps[index].disableIfDirty ??
						!parameterProps[index].acceptRejectMode
					}
				/>,
			);
		});
		return map;
	}, [parameters, componentContext]);

	// Create export map for quick lookup
	const exportMap = useMemo(() => {
		const map = new Map<string, ReactElement>();
		exports.forEach((exp, index) => {
			const ExportComponent = getExportComponent(
				componentContext,
				exp.definition,
			);

			map.set(
				exportProps.exports[index].exportId,
				<Paper key={exp.definition.id} shadow="none">
					<ExportComponent
						namespace={namespace}
						exportId={exportProps.exports[index].exportId}
						overrides={exportProps.exports[index].overrides}
					/>
				</Paper>,
			);
		});
		return map;
	}, [exports, componentContext]);

	// Create components in the exact order specified by controls array
	const orderedComponents = useMemo(() => {
		const components: ReactElement[] = [];

		controls.forEach((control, index) => {
			if (control.type === "parameter") {
				const p = control.props as IAppBuilderControlParameterRef;
				const component = parameterMap.get(p.name);
				if (component) {
					components.push(component);
				}
			} else if (control.type === "export") {
				const e = control.props as IAppBuilderControlExportRef;
				const component = exportMap.get(e.name);
				if (component) {
					components.push(component);
				}
			} else if (control.type === "action") {
				const action = (control.props as IAppBuilderControlActionRef)
					.definition;
				const actionComponent = AppBuilderActionFromType(
					action,
					namespace,
					index,
				);
				if (actionComponent) {
					components.push(actionComponent);
				}
			}
		});

		return components;
	}, [controls, parameterMap, exportMap, namespace]);

	if (orderedComponents.length === 0) {
		return <></>;
	}

	// If we only have one component, return it directly
	if (orderedComponents.length === 1) {
		return orderedComponents[0];
	}

	// Return all components in a stack
	return <Stack>{orderedComponents}</Stack>;
}
