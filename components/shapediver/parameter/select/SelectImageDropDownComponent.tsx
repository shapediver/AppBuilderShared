import {Select} from "@mantine/core";
import React from "react";
import {SelectComponentProps} from "./SelectComponent";

/**
 * Functional dropdown select component that can display images and descriptions.
 *
 * @see https://mantine.dev/combobox/?e=SelectOptionComponent
 */
export default function SelectImageDropDownComponent(
	props: SelectComponentProps,
) {
	const {value, onChange, items, disabled, itemData} = props;

	// TODO implement image dropdown select component, see link to custom combobox example:
	// https://mantine.dev/combobox/?e=SelectOptionComponent
	// use description and imageUrl from itemData to display images and descriptions
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
