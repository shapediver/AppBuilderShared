import { TextInput } from "@mantine/core";
import React from "react";
import ParameterLabelComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterLabelComponent";
import { PropsParameter } from "@AppBuilderShared/types/components/shapediver/propsParameter";
import { useParameterComponentCommons } from "@AppBuilderShared/hooks/shapediver/parameters/useParameterComponentCommons";

/**
 * Functional component that creates a string input component for a string parameter.
 *
 * @returns
 */
export default function ParameterStringComponent(props: PropsParameter) {

	const {
		definition,
		value,
		handleChange,
		onCancel,
		disabled
	} = useParameterComponentCommons<string>(props);

	return <>
		<ParameterLabelComponent { ...props } cancel={onCancel} />
		{definition && <TextInput
			value={value}
			onChange={(e) => handleChange(e.target.value)}
			disabled={disabled}
			maxLength={definition.max}
		/>}
	</>;
}
