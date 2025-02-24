import {Box, Group, Select, Stack, Text, TextInput} from "@mantine/core";
import {
	ATTRIBUTE_VISUALIZATION,
	INumberAttribute,
} from "@shapediver/viewer.features.attribute-visualization";
import {SDTF_TYPEHINT} from "@shapediver/viewer.session";
import React, {useEffect, useState} from "react";
import BaseAttribute from "@AppBuilderShared/components/shapediver/appbuilder/widgets/attributes/BaseAttribute";
import {IconChevronUp, IconChevronDown} from "@tabler/icons-react";

interface Props {
	name: string;
	attribute: {
		typeHint: string;
		count: number;
		min?: number;
		max?: number;
	};
	updateAttribute: (attribute: INumberAttribute) => void;
	removeAttribute: (name: string, type: string) => void;
	changeOrder: (name: string, type: string, direction: "up" | "down") => void;
}

export default function NumberAttribute(props: Props) {
	const {
		attribute: attributeDefinition,
		name,
		updateAttribute,
		removeAttribute,
		changeOrder,
	} = props;

	const [attribute, setAttribute] = useState<INumberAttribute>({
		key: name,
		type: attributeDefinition.typeHint as SDTF_TYPEHINT,
		visualization: ATTRIBUTE_VISUALIZATION.BLUE_RED,
		min: attributeDefinition.min!,
		max: attributeDefinition.max!,
	});
	const [optionsOpened, setOptionsOpened] = useState(false);
	const [backgroundColor, setBackgroundColor] = useState<string>("");
	const [minValue, setMinValue] = useState<string>(attributeDefinition.min! + "");
	const [maxValue, setMaxValue] = useState<string>(attributeDefinition.max! + "");

	useEffect(() => {
		updateAttribute(attribute);

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
		} else {
			setBackgroundColor(
				"linear-gradient(90deg, " +
					attribute.visualization.replaceAll("_", ", ") +
					")",
			);
		}
	}, [attribute]);

	/**
	 * Create the color legend for the attribute
	 */
	const legend = (
		<Stack p="xs" pb={0}>
			<Group
				justify="space-between"
				onClick={() => setOptionsOpened((t) => !t)}
			>
				<Text size={"sm"} fw={400} fs="italic" ta="left">
					{optionsOpened ? "Hide Legend" : "Show Legend"}
				</Text>
				{optionsOpened ? <IconChevronUp /> : <IconChevronDown />}
			</Group>
			{optionsOpened && (
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
		<BaseAttribute
			name={name}
			type={attributeDefinition.typeHint}
			removeAttribute={removeAttribute}
			changeOrder={changeOrder}
			options={legend}
		>w
			<TextInput
				label="Minimum"
				value={minValue}
				onChange={(event) => {
					setMinValue(event.currentTarget.value);
					// Check if the value is a number
					if (isNaN(+event.currentTarget.value))
						return;
					
					setAttribute({
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
					if (isNaN(+event.currentTarget.value))
						return;

					setAttribute({
						...attribute,
						max: +event.currentTarget.value,
					});
				}}
			/>
			<Select
				label="Visualization"
				value={attribute.visualization}
				data={Object.values(ATTRIBUTE_VISUALIZATION).map((value) => ({
					value,
					label: value.toLocaleUpperCase(),
				}))}
				onChange={(v) => {
					if (!v) return;
					setAttribute((prev) => {
						return {
							...prev,
							visualization: Object.values(
								ATTRIBUTE_VISUALIZATION,
							).find((value) => value === v)!,
						};
					});
				}}
			/>
		</BaseAttribute>
	);
}
