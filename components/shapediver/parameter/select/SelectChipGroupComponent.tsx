import {Chip, Flex} from "@mantine/core";
import React from "react";
import {SelectComponentProps} from "./SelectComponent";

/**
 * Functional chip group select component.
 * Makes use of a group of chip to select an item.
 * @see https://mantine.dev/core/chip/#chipgroup
 */
export default function SelectChipGroupComponent(props: SelectComponentProps) {
	const {value, onChange, items, disabled, itemData} = props;

	// TODO implement button group select component
	// TODO implement tooltips using <TooltipWrapper/> (optional tooltips in itemData)
	return (
		<Chip.Group multiple={false} value={value} onChange={onChange}>
			<Flex gap="xs" wrap="wrap">
				{items.map((item) => (
					<Chip value={item}>{item}</Chip>
				))}
			</Flex>
		</Chip.Group>
	);
}
