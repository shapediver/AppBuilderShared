import {
	defaultPropsParameterWrapper,
	PropsParameterComponent,
	PropsParameterWrapper,
} from "../config/propsParameter";
import {useParameterComponentCommons} from "../model/useParameterComponentCommons";
import ParameterLabelComponent from "./ParameterLabelComponent";
import ParameterWrapperComponent from "./ParameterWrapperComponent";
import {Switch, useProps} from "@mantine/core";
import React from "react";

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
		formInputProps,
		formKey,
	} = useParameterComponentCommons<boolean>(props, 0);

	// Get wrapperProps from useProps
	const {wrapperComponent, wrapperProps} = useProps(
		"ParameterBooleanComponent",
		defaultPropsParameterWrapper,
		props,
	);

	return (
		<ParameterWrapperComponent
			onCancel={onCancel}
			component={wrapperComponent}
			{...wrapperProps}
		>
			<ParameterLabelComponent {...props} cancel={onCancel} />
			{definition && (
				<Switch
					key={formKey}
					{...(formInputProps || {})}
					checked={
						value === true ||
						value.toString().toLowerCase() === "true"
					}
					onChange={(e) => {
						handleChange(e.currentTarget.checked);
						if (formInputProps?.onChange) {
							formInputProps.onChange(e);
						}
					}}
					disabled={disabled}
				/>
			)}
		</ParameterWrapperComponent>
	);
}
