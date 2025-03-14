import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {Button, Flex} from "@mantine/core";
import React from "react";
import classes from "./SelectColorComponent.module.css";
import {SelectComponentProps} from "./SelectComponent";

/**
 * Functional color select component.
 * Makes use of colored buttons aligned using a flex container to select an item.
 * @see https://mantine.dev/core/button
 * @see https://mantine.dev/core/flex/
 */
export default function SelectColorComponent(props: SelectComponentProps) {
	const {onChange, items, itemData, disabled, value} = props;

	return (
		<Flex gap="xs" wrap="wrap">
			{items.map((item) => {
				const data = itemData?.[item];
				const tooltip = data?.tooltip;

				const button = (
					<Button
						key={item}
						color={data?.color}
						variant="filled"
						onClick={() => onChange(item)}
						disabled={disabled}
						className={`${classes.btnColor} ${item === value ? classes.btnColorSelected : ""}`}
					/>
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
