import {Button, Flex} from "@mantine/core";
import React from "react";
import {TooltipWrapper} from "~/shared/shared/ui/tooltip";
import {parameterMultiSelect} from "~/shared/utils/parameters/parameterMultiSelect";
import {UniversalMultiSelectComponentProps} from "../multiselect/MultiSelectComponent";

/**
 * Functional button flex select component.
 * Makes use of buttons aligned using a flex container to select an item.
 * @see https://mantine.dev/core/button
 * @see https://mantine.dev/core/flex/
 */
export default function SelectButtonFlexComponent(
	props: UniversalMultiSelectComponentProps,
) {
	const {value, onChange, items, disabled, itemData, multiselect} = props;
	const {handleClick, isSelected} = parameterMultiSelect(
		value,
		onChange,
		multiselect,
	);

	return (
		<Flex gap="xs" wrap="wrap">
			{items.map((item) => {
				const data = itemData?.[item];
				const displayName = data?.displayname || item;
				const tooltip = data?.tooltip;

				const button = (
					<Button
						key={item}
						variant={isSelected(item) ? "filled" : "default"}
						color={data?.color}
						onClick={() => handleClick(item)}
						disabled={disabled}
					>
						{displayName}
					</Button>
				);
				return tooltip ? (
					<TooltipWrapper key={item} label={tooltip}>
						{button}
					</TooltipWrapper>
				) : (
					button
				);
			})}
		</Flex>
	);
}
