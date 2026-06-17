import {PropsExportWithForm} from "@AppBuilderLib/entities/export/config/propsExport";
import {useExport} from "@AppBuilderLib/entities/export/model/useExport";
import {IShapeDiverParameterActions} from "@AppBuilderLib/entities/parameter/config/parameter";
import {
	PropsParameter,
	PropsParameterComponent,
} from "@AppBuilderLib/entities/parameter/config/propsParameter";
import {buildParameterValidator} from "@AppBuilderLib/entities/parameter/lib/parameterFormValidation";
import {useParameters} from "@AppBuilderLib/entities/parameter/model/useParameters";
import {
	IAppBuilderWidgetPropsForm,
	isParameterRefControl,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {ComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext";
import {
	getExportComponent,
	getParameterComponent,
} from "@AppBuilderLib/features/appbuilder/config/componentTypes";
import type {MantineActionIconProps} from "@AppBuilderLib/shared/mantine-props/actionIcon";
import type {MantineButtonProps} from "@AppBuilderLib/shared/mantine-props/button";
import type {MantinePaperProps} from "@AppBuilderLib/shared/mantine-props/paper";
import type {MantineStackProps} from "@AppBuilderLib/shared/mantine-props/stack";
import Icon from "@AppBuilderLib/shared/ui/icon/Icon";
import MarkdownWidgetComponent from "@AppBuilderLib/shared/ui/markdown/MarkdownWidgetComponent";
import {
	ActionIcon,
	Group,
	MantineThemeComponent,
	Paper,
	Stack,
	useProps,
} from "@mantine/core";
import {useForm} from "@mantine/form";
import React, {
	ReactElement,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import {mergeFormExportParameterValues} from "../lib/mergeFormExportParameterValues";

/**
 * @docAttached
 * @category widget
 * @configPath themeOverrides.components.AppBuilderFormWidgetComponent.defaultProps
 * @displayName AppBuilderFormWidgetComponent
 */
export interface AppBuilderFormWidgetComponentStyleProps {
	stackProps?: MantineStackProps;
	formPaperProps?: MantinePaperProps;
	elementPaperProps?: MantinePaperProps;
	exportPaperProps?: MantinePaperProps;
	submitButtonPaperProps?: MantinePaperProps;
	messagePaperProps?: MantinePaperProps;
	submitButtonProps?: MantineButtonProps;
	resetButtonProps?: MantineActionIconProps;
	resetMessage?: string;
}

const defaultStyleProps = {
	stackProps: {
		gap: 0,
	},
	formPaperProps: {
		withBorder: true,
		shadow: "none",
		p: 0,
	},
	elementPaperProps: {
		shadow: "none",
		withBorder: false,
		px: 0,
		pt: 0,
		pb: "sm",
	},
	exportPaperProps: {
		shadow: "none",
		withBorder: false,
		px: 0,
		py: 0,
		mt: "xs",
	},
	submitButtonPaperProps: {
		shadow: "none",
	},
	messagePaperProps: {
		shadow: "sm",
		p: "md",
	},
	submitButtonProps: {
		variant: "filled",
		fullWidth: true,
		mt: "md",
	},
	resetButtonProps: {
		variant: "subtle",
		size: "sm",
	},
	resetMessage: "Reset form",
};

export type AppBuilderFormWidgetComponentThemePropsType =
	Partial<AppBuilderFormWidgetComponentStyleProps>;

export function AppBuilderFormWidgetComponentThemeProps(
	props: AppBuilderFormWidgetComponentThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

type Props = IAppBuilderWidgetPropsForm &
	AppBuilderFormWidgetComponentThemePropsType & {
		namespace: string;
	};

export default function AppBuilderFormWidgetComponent(props: Props) {
	const {
		controls = [],
		parameters: parameterRefs = [],
		export: exportControl,
		submit = "none",
		successMessage = "Form submitted successfully!",
		errorMessage = "An error occurred while submitting the form.",
		namespace,
		...styleProps
	} = props;

	const componentContext = useContext(ComponentContext);

	const {
		stackProps,
		formPaperProps,
		elementPaperProps,
		exportPaperProps,
		submitButtonProps,
		messagePaperProps,
		resetButtonProps,
		resetMessage,
	} = useProps(
		"AppBuilderFormWidgetComponent",
		defaultStyleProps,
		styleProps,
	);

	const [showMessage, setShowMessage] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const [initialValues, setInitialValues] = useState<Record<string, any>>({});
	const [values, setValues] = useState<Record<string, any>>({});
	const [isMounted, setIsMounted] = useState<boolean>(false);

	// Convert parameter references to component props
	// Support both controls array and parameters array
	const parameterProps: PropsParameter[] = useMemo(() => {
		// If parameters array is provided, use it
		if (parameterRefs.length > 0) {
			return parameterRefs.map((ref) => ({
				namespace: ref.sessionId ?? namespace,
				parameterId: ref.name,
				overrides: ref.overrides,
			}));
		}

		// Otherwise filter controls to only include parameters
		const parameterControls = controls.filter(isParameterRefControl);
		return parameterControls.map((control) => {
			const p = control.props;
			return {
				namespace: p.sessionId ?? namespace,
				parameterId: p.name,
				overrides: p.overrides,
			};
		});
	}, [parameterRefs, controls, namespace]);

	// Get parameters
	const parameters = useParameters(parameterProps);

	// Build validation rules from parameter settings to pass as props
	const validationRules = useMemo(() => {
		const rules: Array<{
			parameterId: string;
			validator: (value: any) => string | null;
		}> = [];
		parameters.forEach((param) => {
			if (param?.definition) {
				const validator = buildParameterValidator(param.definition);
				if (validator) {
					rules.push({
						parameterId: param.definition.id,
						validator,
					});
				}
			}
		});
		return rules;
	}, [parameters]);

	const formParameterValuesForExport = useMemo(() => {
		return parameters
			.map((param, index) => {
				if (!param?.definition || param.definition.hidden) {
					return undefined;
				}
				const ref = parameterProps[index];
				const sessionId =
					ref.namespace !== namespace ? ref.namespace : undefined;

				return {
					name: param.definition.name,
					sessionId,
					value: String(values[param.definition.id] ?? ""),
				};
			})
			.filter((entry) => entry !== undefined);
	}, [parameters, parameterProps, values, namespace]);

	const exportProps: PropsExportWithForm | null = useMemo(() => {
		if (!exportControl) {
			console.warn(
				"AppBuilderFormWidgetComponent: No export control provided",
			);
			return null;
		}
		return {
			namespace: exportControl.sessionId ?? namespace,
			exportId: exportControl.name,
			overrides: exportControl.overrides,
			parameterValues: mergeFormExportParameterValues(
				exportControl.parameterValues,
				formParameterValuesForExport,
			),
		};
	}, [exportControl, formParameterValuesForExport, namespace]);

	const exportData = useExport(
		exportProps ?? {namespace, exportId: "__no_export__"},
	);

	const canSubmitExport = useMemo(() => {
		if (validationRules.length === 0) {
			return true;
		}
		return validationRules.every((rule) => {
			return rule.validator(values[rule.parameterId]) === null;
		});
	}, [validationRules, values]);

	// Initialize Mantine form with validation rules from parameters
	const form = useForm({
		mode: "controlled",
		validateInputOnBlur: true,
		validate: useMemo(() => {
			const validators: Record<string, (value: any) => string | null> =
				{};
			validationRules.forEach((rule) => {
				validators[rule.parameterId] = rule.validator;
			});
			return validators;
		}, [validationRules]),
	});

	// Reset parameters to their default values
	const resetParameters = useCallback(() => {
		setValues(initialValues);
		form.reset();
	}, [initialValues, form]);

	const handleError = useCallback(() => {
		setIsSuccess(false);
		if (submit === "message") {
			setShowMessage(true);
		}
		console.error("Export request failed");
	}, [submit]);

	// Handle form submission with Mantine form validation
	const handleSubmit = useCallback(async () => {
		if (!exportData?.actions) {
			console.error("Export actions not available");
			return;
		}

		try {
			// Handle success
			setIsSuccess(true);
			if (submit === "reset") {
				resetParameters();
			} else if (submit === "message") {
				setShowMessage(true);
			}
		} catch (_error) {
			handleError();
		}
	}, [exportData, submit, resetParameters]);

	const getCustomActions = useCallback(
		(paramId: string): Partial<IShapeDiverParameterActions<any>> => ({
			setUiValue: (v): boolean => {
				setValues((prev) => ({
					...prev,
					[paramId]: v,
				}));
				form.setFieldValue(paramId, v);
				return true;
			},
			execute: (): Promise<any> =>
				new Promise((resolve) => resolve(true)),
			setUiAndExecValue: (v): boolean => {
				setValues((prev) => ({
					...prev,
					[paramId]: v,
				}));
				form.setFieldValue(paramId, v);
				return true;
			},
		}),
		[form],
	);

	// Create parameter components with form instance passed as prop
	const parameterComponents = useMemo(() => {
		const components: ReactElement[] = [];

		parameters.forEach((param, index) => {
			if (!param || param.definition.hidden) return;

			const {component: ParameterComponent, extraBottomPadding} =
				getParameterComponent(componentContext, param.definition);

			// Build props with form instance
			const componentProps: PropsParameterComponent = {
				...parameterProps[index],
				value: values[param.definition.id] as any,
				// defaultValue: undefined,
				form, // Pass form instance as prop
				reactive: false,
				customActions: getCustomActions(param.definition.id),
			};

			components.push(
				<ParameterComponent
					key={param.definition.id}
					{...componentProps}
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

		return components;
	}, [
		parameters,
		componentContext,
		elementPaperProps,
		parameterProps,
		form,
		values,
		getCustomActions,
	]);

	const exportComponent = useMemo(() => {
		if (!exportData) return null;
		const ExportComponent = getExportComponent(
			componentContext,
			exportData.definition,
		);

		const exportButtonLabel =
			exportData.definition.displayname || exportData.definition.name;

		return exportProps ? (
			<Paper {...exportPaperProps}>
				<ExportComponent
					{...exportProps}
					form={form}
					onSuccess={() => handleSubmit()}
					onError={handleError}
					buttonLabel={exportButtonLabel}
					buttonProps={{
						...submitButtonProps,
						disabled:
							!canSubmitExport || submitButtonProps?.disabled,
					}}
				/>
			</Paper>
		) : null;
	}, [
		exportData,
		exportProps,
		componentContext,
		exportPaperProps,
		form,
		handleError,
		handleSubmit,
		submit,
		values,
		canSubmitExport,
		submitButtonProps,
	]);

	// Handle reset from message view
	const handleReset = useCallback(() => {
		setShowMessage(false);
		setIsSuccess(false);
		resetParameters();
	}, [resetParameters]);

	useEffect(() => {
		const currentValues: Record<string, any> = {};
		parameters.forEach((param) => {
			if (param?.definition) {
				currentValues[param.definition.id] = param.definition.defval;
			}
		});
		setInitialValues(currentValues);
		setValues(currentValues);
		form.setInitialValues(currentValues);
		form.setValues(currentValues);
		setIsMounted(true);
	}, []);

	// If showing message after submission
	if (showMessage && submit === "message") {
		return (
			<Paper {...messagePaperProps}>
				<Group align="flex-start">
					<div style={{flex: 1}} />
					<ActionIcon
						onClick={handleReset}
						title={resetMessage}
						aria-label={resetMessage}
						{...resetButtonProps}
					>
						<Icon iconType={"tabler:refresh"} />
					</ActionIcon>
				</Group>
				<MarkdownWidgetComponent>
					{isSuccess ? successMessage : errorMessage}
				</MarkdownWidgetComponent>
			</Paper>
		);
	}

	// If no parameters, return empty
	if (parameterComponents.length === 0) {
		console.warn("AppBuilderFormWidgetComponent: No parameters found");
		return <></>;
	}

	// If no export, return empty
	if (!exportData) {
		console.error(
			"AppBuilderFormWidgetComponent: Export not found",
			exportControl,
		);
		return <></>;
	}

	// Render form with form instance passed as prop to children
	return (
		<form
			className="app-builder-form-widget"
			onSubmit={form.onSubmit(handleSubmit)}
		>
			<Paper {...formPaperProps}>
				<Stack {...stackProps}>
					{isMounted && parameterComponents}
					{isMounted && exportComponent}
				</Stack>
			</Paper>
		</form>
	);
}
