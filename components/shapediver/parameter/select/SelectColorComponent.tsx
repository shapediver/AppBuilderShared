import {Button, Flex} from "@mantine/core";
import React from "react";
import {SelectComponentProps} from "./SelectComponent";

/**
 * Functional color select component.
 * Makes use of colored buttons aligned using a flex container to select an item.
 * @see https://mantine.dev/core/button
 * @see https://mantine.dev/core/flex/
 */
export default function SelectColorComponent(props: SelectComponentProps) {
	const {value, onChange, items, itemData, disabled} = props;

	// TODO implement color select component
	// TODO implement tooltips using <TooltipWrapper/> (optional tooltips in itemData)
	return (
		<Flex gap="xs" wrap="wrap">
			{items.map((item) => (
				<Button
					key={item}
					color={itemData && itemData[item] && itemData[item].color}
					variant="filled"
					// TODO show selection status using outline on root element
					// see https://mantine.dev/core/button/#styles-api
				/>
			))}
		</Flex>
	);
}
