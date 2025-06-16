import BaseAttribute from "@AppBuilderShared/components/shapediver/appbuilder/widgets/attributes/BaseAttribute";
import {Box, Group, Stack, Text, TextInput} from "@mantine/core";
import {
	ATTRIBUTE_VISUALIZATION,
	INumberAttribute,
} from "@shapediver/viewer.features.attribute-visualization";
import React, {useEffect, useState} from "react";

interface Props {
	name: string;
	attribute: INumberAttribute;
	showLegend?: boolean;
	updateAttribute: (attribute: INumberAttribute) => void;
}

export default function NumberAttribute(props: Props) {
	const {attribute, name, updateAttribute} = props;

	const [backgroundColor, setBackgroundColor] = useState<string>("");
	const [minValue, setMinValue] = useState<string>(attribute.min + "");
	const [maxValue, setMaxValue] = useState<string>(attribute.max + "");

	useEffect(() => {
		updateAttribute(attribute);
		setMinValue(attribute.min + "");
		setMaxValue(attribute.max + "");

		// Set background color
		if (
			attribute.visualization === ATTRIBUTE_VISUALIZATION.GRAYSCALE ||
			attribute.visualization === ATTRIBUTE_VISUALIZATION.OPACITY
		) {
			setBackgroundColor("linear-gradient(90deg, #000000, #ffffff)");
		} else if (attribute.visualization === ATTRIBUTE_VISUALIZATION.HSL) {
			// show full hsl gradient
			setBackgroundColor(
				"linear-gradient(90deg, hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), hsl(360, 100%, 50%))",
			);
		} else if (typeof attribute.visualization === "string") {
			setBackgroundColor(
				"linear-gradient(90deg, " +
					(attribute.visualization as string).replaceAll("_", ", ") +
					")",
			);
		}
	}, [attribute]);

	/**
	 * Create the color legend for the attribute
	 */
	const legend = (
		<Stack p="xs" pb={0}>
			{(props.showLegend ?? true) && (
				<Stack>
					<Box
						style={{
							width: "100%",
							height: 40,
							borderRadius: 4,
							background: backgroundColor,
						}}
					/>
					<Stack>
						<Group justify="space-between">
							<Text size="xs">{attribute.min}</Text>
							<Text size="xs">{attribute.max}</Text>
						</Group>
					</Stack>
				</Stack>
			)}
		</Stack>
	);

	return (
		<BaseAttribute name={name} type={attribute.type} options={legend}>
			<TextInput
				label="Minimum"
				value={minValue}
				onChange={(event) => {
					setMinValue(event.currentTarget.value);
					// Check if the value is a number
					if (isNaN(+event.currentTarget.value)) return;
					updateAttribute({
						...attribute,
						min: +event.currentTarget.value,
					});
				}}
			/>
			<TextInput
				label="Maximum"
				value={maxValue}
				onChange={(event) => {
					setMaxValue(event.currentTarget.value);
					// Check if the value is a number
					if (isNaN(+event.currentTarget.value)) return;

					updateAttribute({
						...attribute,
						max: +event.currentTarget.value,
					});
				}}
			/>
		</BaseAttribute>
	);
}
