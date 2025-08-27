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
	IAppBuilderWidgetPropsControls,
	isActionRefControl,
	isExportRefControl,
	isParameterRefControl,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import {
	MantineThemeComponent,
	Paper,
	PaperProps,
	Stack,
	StackProps,
	useProps,
} from "@mantine/core";
import React, {ReactElement, useContext, useMemo} from "react";

interface StyleProps {
	stackProps?: StackProps;
	elementPaperProps?: PaperProps;
}

const defaultStyleProps: Partial<StyleProps> = {
	stackProps: {},
	elementPaperProps: {
		shadow: "none",
	},
};

type AppBuilderControlsWidgetComponentThemePropsType = Partial<StyleProps>;

export function AppBuilderControlsWidgetComponentThemeProps(
	props: AppBuilderControlsWidgetComponentThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

type Props = IAppBuilderWidgetPropsControls &
	AppBuilderControlsWidgetComponentThemePropsType & {
		namespace: string;
	};

export default function AppBuilderControlsWidgetComponent(props: Props) {
	const {controls = [], namespace, ...styleProps} = props;
	const componentContext = useContext(ComponentContext);

	const {stackProps, elementPaperProps} = useProps(
		"AppBuilderControlsWidgetComponent",
		defaultStyleProps,
		styleProps,
	);

	// Convert parameter and export references to component props
	const parameterProps: PropsParameter[] = useMemo(
		() =>
			controls.filter(isParameterRefControl).map((control) => {
				const p = control.props;
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
		() =>
			controls.filter(isExportRefControl).map((control) => {
				const p = control.props;
				return {
					namespace: p.sessionId ?? namespace,
					exportId: p.name,
					overrides: p.overrides,
				};
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
			if (!param) return;
			const {component: ParameterComponent, extraBottomPadding} =
				getParameterComponent(componentContext, param.definition);

			map.set(
				parameterProps[index].parameterId,
				<ParameterComponent
					key={param.definition.id}
					{...parameterProps[index]}
					wrapperComponent={Paper}
					wrapperProps={{
						...elementPaperProps,
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
	}, [parameters, componentContext, elementPaperProps]);

	// Create export map for quick lookup
	const exportMap = useMemo(() => {
		const map = new Map<string, ReactElement>();
		exports.forEach((exp, index) => {
			if (!exp) return;
			const ExportComponent = getExportComponent(
				componentContext,
				exp.definition,
			);

			map.set(
				exportProps[index].exportId,
				<Paper key={exp.definition.id} {...elementPaperProps}>
					<ExportComponent {...exportProps[index]} />
				</Paper>,
			);
		});
		return map;
	}, [exports, componentContext, elementPaperProps]);

	// Create components in the exact order specified by controls array
	const orderedComponents = useMemo(() => {
		const components: ReactElement[] = [];

		controls.forEach((control, index) => {
			if (isParameterRefControl(control)) {
				const component = parameterMap.get(control.props.name);
				if (component) {
					components.push(component);
				}
			} else if (isExportRefControl(control)) {
				const component = exportMap.get(control.props.name);
				if (component) {
					components.push(component);
				}
			} else if (isActionRefControl(control)) {
				const actionComponent = AppBuilderActionFromType(
					control.props,
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
	return <Stack {...stackProps}>{orderedComponents}</Stack>;
}
