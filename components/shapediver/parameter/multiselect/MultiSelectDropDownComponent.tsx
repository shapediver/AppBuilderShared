import {MultiSelect} from "@mantine/core";
import React from "react";
import {MultiSelectComponentProps} from "./MultiSelectComponent";

/**
 * Functional dropdown multiselect component.
 *
 * @see https://mantine.dev/core/multi-select/
 */
export default function MultiSelectDropDownComponent(
	props: MultiSelectComponentProps,
) {
	const {value, onChange, items, disabled, inputContainer} = props;

	return (
		<MultiSelect
			value={value}
			onChange={onChange}
			data={items}
			disabled={disabled}
			inputContainer={inputContainer}
		/>
	);
}
