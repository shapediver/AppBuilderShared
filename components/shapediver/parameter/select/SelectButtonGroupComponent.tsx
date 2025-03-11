import {Button} from "@mantine/core";
import React from "react";
import {SelectComponentProps} from "./SelectComponent";

/**
 * Functional button group select component.
 * Makes use of a group of buttons to select an item.
 * @see https://mantine.dev/core/button/#buttongroup
 */
export default function SelectButtonGroupComponent(
	props: SelectComponentProps,
) {
	const {value, onChange, items, disabled} = props;

	// TODO implement button group select component
	// TODO implement tooltips using <TooltipWrapper/> (optional tooltips in itemData)
	return (
		<Button.Group>
			{items.map((item) => (
				<Button
					key={item}
					variant={value === item ? "filled" : "default"}
				>
					{item}
				</Button>
			))}
		</Button.Group>
	);
}
