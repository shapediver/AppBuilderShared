import {Group, Image, Select, SelectProps, Text} from "@mantine/core";
import React from "react";
import {SelectComponentProps} from "./SelectComponent";

/**
 * Custom data type for select options with image and description
 */
interface CustomSelectItem {
	value: string;
	label: string;
	description?: string;
	imageUrl?: string;
	width?: number;
}

/**
 * Functional dropdown select component that can display images and descriptions.
 *
 * @see https://mantine.dev/combobox/?e=SelectOptionComponent
 */
export default function SelectImageDropDownComponent(
	props: SelectComponentProps,
) {
	const {value, onChange, items, disabled, itemData} = props;

	// Transform items array into the format expected by Select component
	const selectData = items.map((item) => {
		const data = itemData?.[item];
		return {
			value: item,
			label: data?.displayname || item,
			description: data?.description,
			imageUrl: data?.imageUrl,
			width: data?.width || "100px",
		};
	});

	// Custom render function for options
	const renderOption: SelectProps["renderOption"] = ({option}) => {
		// Cast option to our custom type
		const customOption = option as CustomSelectItem;

		return (
			<Group wrap="nowrap">
				{customOption.imageUrl && (
					<Image
						src={customOption.imageUrl}
						w={customOption.width}
						h="auto"
						fit="contain"
						alt={customOption.label}
						fallbackSrc="/not-found.svg"
					/>
				)}
				<div>
					<Text size="sm">{customOption.label}</Text>
					{customOption.description && (
						<Text size="xs" color="dimmed">
							{customOption.description}
						</Text>
					)}
				</div>
			</Group>
		);
	};

	return (
		<Select
			value={value}
			onChange={onChange}
			data={selectData}
			disabled={disabled}
			renderOption={renderOption}
			allowDeselect={false}
		/>
	);
}
