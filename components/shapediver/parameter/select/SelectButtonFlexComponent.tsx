import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {Button, Flex} from "@mantine/core";
import React from "react";
import {SelectComponentProps} from "./SelectComponent";

/**
 * Functional button flex select component.
 * Makes use of buttons aligned using a flex container to select an item.
 * @see https://mantine.dev/core/button
 * @see https://mantine.dev/core/flex/
 */
export default function SelectButtonFlexComponent(props: SelectComponentProps) {
	const {value, onChange, items, disabled, itemData} = props;

	// TODO implement button flex select component
	return (
		<Flex gap="xs" wrap="wrap">
			{items.map((item) => {
				const data = itemData?.[item];
				const button = (
					<Button
						key={item}
						variant={value === item ? "filled" : "default"}
						color={data?.color}
					>
						{data?.displayname || item}
					</Button>
				);
				return data?.tooltip ? (
					<TooltipWrapper key={item} label={data.tooltip}>
						{button}
					</TooltipWrapper>
				) : (
					button
				);
			})}
		</Flex>
	);
}
