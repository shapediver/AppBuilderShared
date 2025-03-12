import {Button} from "@mantine/core";
import React from "react";
import TooltipWrapper from "~/shared/components/ui/TooltipWrapper";
import {SelectComponentProps} from "./SelectComponent";

/**
 * Functional button group select component.
 * Makes use of a group of buttons to select an item.
 * @see https://mantine.dev/core/button/#buttongroup
 */
export default function SelectButtonGroupComponent(
	props: SelectComponentProps,
) {
	const {value, onChange, items, itemData, disabled} = props;

	return (
		<Button.Group>
			{items.map((item) => {
				const data = itemData?.[item];
				const displayName = data?.displayname || item;
				const tooltip = data?.tooltip;

				const button = (
					<Button
						key={item}
						variant={value === item ? "filled" : "default"}
						color={data?.color}
						onClick={() => onChange(item)}
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
