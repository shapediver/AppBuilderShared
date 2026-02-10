import {ComponentContext} from "@AppBuilderShared/context/ComponentContext";
import {useExport} from "@AppBuilderShared/hooks/shapediver/parameters/useExport";
import {useParameters} from "@AppBuilderShared/hooks/shapediver/parameters/useParameters";
import {
	getExportComponent,
	getParameterComponent,
} from "@AppBuilderShared/types/components/shapediver/componentTypes";
import {
	PropsParameter,
	PropsParameterComponent,
} from "@AppBuilderShared/types/components/shapediver/propsParameter";
import {
	IAppBuilderWidgetPropsForm,
	isParameterRefControl,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import {buildParameterValidator} from "@AppBuilderShared/utils/validation/parameterValidation";
import {
	ActionIcon,
	ActionIconProps,
	ButtonProps,
	Group,
	MantineThemeComponent,
	Paper,
	PaperProps,
	Stack,
	StackProps,
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
import {undefined} from "zod";
import MarkdownWidgetComponent from "~/shared/components/shapediver/ui/MarkdownWidgetComponent";
import Icon from "~/shared/components/ui/Icon";
import {PropsExportWithForm} from "~/shared/types/components/shapediver/propsExport";
import {IShapeDiverParameterActions} from "~/shared/types/shapediver/parameter";

interface StyleProps {
	stackProps?: StackProps;
	elementPaperProps?: PaperProps;
	submitButtonPaperProps?: PaperProps;
	messagePaperProps?: PaperProps;
	submitButtonProps?: ButtonProps;
	resetButtonProps?: ActionIconProps;
}

const defaultStyleProps: Partial<StyleProps> = {
	stackProps: {},
	elementPaperProps: {
		shadow: "none",
	},
	submitButtonPaperProps: {
		shadow: "none",
	},
	messagePaperProps: {
		shadow: "sm",
		p: "md",
	},
	submitButtonProps: {
		fullWidth: true,
		mt: "md",
	},
	resetButtonProps: {
		variant: "subtle",
		size: "sm",
	},
};

export type AppBuilderFormWidgetComponentThemePropsType = Partial<StyleProps>;

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

	const {stackProps, elementPaperProps, messagePaperProps, resetButtonProps} =
		useProps(
			"AppBuilderFormWidgetComponent",
			defaultStyleProps,
			styleProps,
		);

	const [showMessage, setShowMessage] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const [initialValues, setInitialValues] = useState<Record<string, any>>({});
	const [values, setValues] = useState<Record<string, any>>({});
	const [isMounted, setIsMounted] = useState<boolean>(false);

	// Handle export reference
	const exportProps: PropsExportWithForm | null = useMemo(() => {
		if (!exportControl) {
			console.warn(
				"AppBuilderFormWidgetComponent: No export control provided",
			);
			return null;
		}
		// Treat export as IAppBuilderExportRef
		return {
			namespace: exportControl.sessionId ?? namespace,
			exportId: exportControl.name,
			overrides: exportControl.overrides,
			parameterValues: Object.entries(values).map(([id, value]) => ({
				parameter: {name: id},
				value,
			})),
		};
	}, [exportControl, values, namespace]);

	// Get export definition and actions
	const exportData = useExport(
		exportProps ?? {namespace, exportId: "__no_export__"},
	);

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
	// Initialize Mantine form with validation rules from parameters
	const form = useForm({
		mode: "controlled",
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

	const handleError = useCallback(
		(error: any) => {
			setIsSuccess(false);
			if (submit === "message") {
				setShowMessage(true);
			}
			console.error("Export request failed:", error);
		},
		[submit],
	);

	// Handle form submission with Mantine form validation
	const handleSubmit = useCallback(
		async (values: Record<string, any>) => {
			if (!exportData?.actions) {
				console.error("Export actions not available");
				return;
			}

			try {
				// Build parameter values from form values
				const parameterValues: {[key: string]: string} = {};
				Object.entries(values).forEach(([id, value]) => {
					parameterValues[id] = String(value);
				});
				// Request export with form parameter values
				// Values are NOT applied to the app - they're only used for export
				await exportData.actions.request(parameterValues);
				// Handle success
				setIsSuccess(true);

				if (submit === "reset") {
					resetParameters();
				} else if (submit === "message") {
					setShowMessage(true);
				}
			} catch (error) {
				handleError(error);
			}
		},
		[exportData, submit, resetParameters],
	);

	const getCustomActions = (
		paramId: string,
	): Partial<IShapeDiverParameterActions<any>> => ({
		setUiValue: (v): boolean => {
			setValues({
				...values,
				[paramId]: v,
			});
			form.setFieldValue(paramId, v);
			return true;
		},
		execute: (): Promise<any> => new Promise((resolve) => resolve(true)),
		setUiAndExecValue: (v): boolean => {
			setValues({
				...values,
				[paramId]: v,
			});
			form.setFieldValue(paramId, v);
			return true;
		},
	});

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
	}, [parameters, componentContext, elementPaperProps, parameterProps, form]);

	const exportComponent = useMemo(() => {
		if (!exportData) return null;
		const ExportComponent = getExportComponent(
			componentContext,
			exportData.definition,
		);

		return exportProps ? (
			<ExportComponent
				{...exportProps}
				form={form}
				onSuccess={() => handleSubmit(values)}
				onError={handleError}
			/>
		) : null;
	}, [
		exportData,
		exportProps,
		componentContext,
		form,
		handleError,
		handleSubmit,
		submit,
		values,
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
						title="Reset form"
						aria-label="Reset form"
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
		<form onSubmit={form.onSubmit(handleSubmit)}>
			<Stack {...stackProps}>
				{isMounted && parameterComponents}
				{isMounted && exportComponent}
			</Stack>
		</form>
	);
}
