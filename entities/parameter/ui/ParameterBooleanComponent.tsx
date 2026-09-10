import {Switch, useProps} from "@mantine/core";
import {
	defaultPropsParameterWrapper,
	PropsParameterComponent,
	PropsParameterWrapper,
} from "../config/propsParameter";
import {useParameterComponentCommons} from "../model/useParameterComponentCommons";
import ParameterLabelComponent from "./ParameterLabelComponent";
import ParameterResetRow from "./ParameterResetRow";
import ParameterWrapperComponent from "./ParameterWrapperComponent";

/**
 * Functional component that creates a button for a boolean parameter.
 *
 * @returns
 */
export default function ParameterBooleanComponent(
	props: PropsParameterComponent & Partial<PropsParameterWrapper>,
) {
	const {
		definition,
		value,
		handleChange,
		onCancel,
		disabled,
		showReset,
		resetToDefault,
		formInputProps,
		formKey,
	} = useParameterComponentCommons<boolean>(props, 0);

	// Get wrapperProps from useProps
	const {wrapperComponent, wrapperProps} = useProps(
		"ParameterBooleanComponent",
		defaultPropsParameterWrapper,
		props,
	);

	const control = (
		<Switch
			key={formKey}
			{...(formInputProps || {})}
			checked={
				value === true || value.toString().toLowerCase() === "true"
			}
			onChange={(e) => {
				handleChange(e.currentTarget.checked);
				if (formInputProps?.onChange) {
					formInputProps.onChange(e);
				}
			}}
			disabled={disabled}
		/>
	);

	return (
		<ParameterWrapperComponent
			onCancel={onCancel}
			component={wrapperComponent}
			{...wrapperProps}
		>
			<ParameterLabelComponent {...props} cancel={onCancel} />
			{definition && (
				<ParameterResetRow
					show={showReset}
					onClick={resetToDefault}
					disabled={disabled}
				>
					{control}
				</ParameterResetRow>
			)}
		</ParameterWrapperComponent>
	);
}
