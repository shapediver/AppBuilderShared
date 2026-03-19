import {parameterMultiSelect} from "@AppBuilderLib/entities/parameter";
import {TooltipWrapper} from "@AppBuilderLib/shared/ui/tooltip";
import {Button} from "@mantine/core";
import React from "react";
import {UniversalMultiSelectComponentProps} from "../multiselect";

/**
 * Functional button group select component.
 * Makes use of a group of buttons to select an item.
 * @see https://mantine.dev/core/button/#buttongroup
 */
export default function SelectButtonGroupComponent(
	props: UniversalMultiSelectComponentProps,
) {
	const {value, onChange, items, itemData, disabled, multiselect, ...rest} =
		props;
	const {handleClick, isSelected} = parameterMultiSelect(
		value,
		onChange,
		multiselect,
	);

	return (
		<Button.Group {...rest}>
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
		</Button.Group>
	);
}
