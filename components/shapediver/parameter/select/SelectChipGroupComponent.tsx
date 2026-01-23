import {Chip, Flex} from "@mantine/core";
import React from "react";
import {TooltipWrapper} from "~/shared/shared/ui/tooltip";
import {UniversalMultiSelectComponentProps} from "../multiselect/MultiSelectComponent";

/**
 * Functional chip group select component.
 * Makes use of a group of chip to select an item.
 * @see https://mantine.dev/core/chip/#chipgroup
 */
export default function SelectChipGroupComponent(
	props: UniversalMultiSelectComponentProps,
) {
	const {
		value,
		onChange,
		items,
		disabled,
		itemData,
		onFocus,
		onBlur,
		multiselect,
	} = props;

	const handleChange = (val: string | string[]) => {
		if (multiselect) {
			(onChange as (value: string[]) => void)(val as string[]);
		} else {
			(onChange as (value: string | null) => void)(val as string);
		}
	};

	return (
		<Chip.Group
			multiple={multiselect}
			value={value ?? (multiselect ? [] : null)}
			onChange={handleChange}
		>
			<Flex gap="xs" wrap="wrap">
				{items.map((item) => {
					const data = itemData?.[item];
					const displayName = data?.displayname || item;
					const tooltip = data?.tooltip;

					const chip = (
						<Chip
							key={item}
							value={item}
							disabled={disabled}
							color={data?.color}
							onFocus={onFocus}
							onBlur={onBlur}
						>
							{displayName}
						</Chip>
					);

					return tooltip ? (
						<TooltipWrapper
							key={item}
							label={tooltip}
							refProp="rootRef"
						>
							{chip}
						</TooltipWrapper>
					) : (
						chip
					);
				})}
			</Flex>
		</Chip.Group>
	);
}
