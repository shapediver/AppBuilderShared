import {useParameterComponentCommons} from "@AppBuilderShared/hooks/shapediver/parameters/useParameterComponentCommons";
import {PropsParameter} from "@AppBuilderShared/types/components/shapediver/propsParameter";
import {Switch} from "@mantine/core";
import React from "react";
import ParameterLabelComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterLabelComponent";

/**
 * Functional component that creates a button for a boolean parameter.
 *
 * @returns
 */
export default function ParameterBooleanComponent(props: PropsParameter) {
	const {definition, value, handleChange, onCancel, disabled} =
		useParameterComponentCommons<boolean>(props, 0);

	return (
		<>
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
		</>
	);
}
