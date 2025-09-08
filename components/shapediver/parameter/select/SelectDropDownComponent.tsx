import {ComboboxParsedItem, Select, defaultOptionsFilter} from "@mantine/core";
import React, {useCallback} from "react";
import {SelectComponentProps} from "./SelectComponent";

/**
 * Functional dropdown select component.
 *
 * @see https://mantine.dev/core/select/
 */
export default function SelectDropDownComponent(props: SelectComponentProps) {
	const {
		value,
		onChange,
		items,
		disabled,
		inputContainer,
		searchable,
		limit,
	} = props;

	const onSearch = useCallback(
		({
			options,
			search,
			limit,
		}: {
			options: ComboboxParsedItem[];
			search: string;
			limit: number;
		}) => {
			const list = defaultOptionsFilter({options, search, limit});
			if (!value) return list;

			const foundIndex = list.findIndex((it: any) => {
				if ("group" in it) {
					return it.items?.some((item: any) => item.value === value);
				}
				return it.value === value;
			});

			if (foundIndex > 0) {
				const foundItem = list.splice(foundIndex, 1)[0];

				// If it's a group, move selected item to top within the group
				if ("group" in foundItem) {
					const selectedItemIndex = foundItem.items.findIndex(
						(item: any) => item.value === value,
					);
					if (selectedItemIndex > 0) {
						const selectedItem = foundItem.items.splice(
							selectedItemIndex,
							1,
						)[0];
						foundItem.items.unshift(selectedItem);
					}
				}

				return [foundItem, ...list];
			}

			return list;
		},
		[value],
	);

	return (
		<Select
			value={value}
			onChange={onChange}
			data={items}
			disabled={disabled}
			allowDeselect={false}
			inputContainer={inputContainer}
			searchable={searchable}
			limit={searchable ? (limit ?? 5) : undefined}
			filter={searchable ? onSearch : undefined}
		/>
	);
}
