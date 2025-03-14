import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
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

	return (
		<Chip.Group multiple={false} value={value} onChange={onChange}>
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
