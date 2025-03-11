import {Select} from "@mantine/core";
import React from "react";
import {SelectComponentProps} from "./SelectComponent";

/**
 * Functional dropdown select component.
 *
 * @see https://mantine.dev/core/select/
 */
export default function SelectDropDownComponent(props: SelectComponentProps) {
	const {value, onChange, items, disabled} = props;

	return (
		<Select
			value={value}
			onChange={onChange}
			data={items}
			disabled={disabled}
			allowDeselect={false}
		/>
	);
}
