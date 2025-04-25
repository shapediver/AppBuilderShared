import ParameterLabelComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterLabelComponent";
import ParameterWrapperComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterWrapperComponent";
import {useParameterComponentCommons} from "@AppBuilderShared/hooks/shapediver/parameters/useParameterComponentCommons";
import {
	defaultPropsParameterWrapper,
	PropsParameter,
	PropsParameterWrapper,
} from "@AppBuilderShared/types/components/shapediver/propsParameter";
import {Switch, useProps} from "@mantine/core";
import React from "react";

/**
 * Functional component that creates a button for a boolean parameter.
 *
 * @returns
 */
export default function ParameterBooleanComponent(
	props: PropsParameter & Partial<PropsParameterWrapper>,
) {
	const {definition, value, handleChange, onCancel, disabled} =
		useParameterComponentCommons<boolean>(props, 0);

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
					checked={
						value === true ||
						value.toString().toLowerCase() === "true"
					}
					onChange={(e) => handleChange(e.currentTarget.checked)}
					disabled={disabled}
				/>
			)}
		</ParameterWrapperComponent>
	);
}
