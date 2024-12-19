import { Box, Group, Select, Stack, Text, TextInput } from "@mantine/core";
import { ATTRIBUTE_VISUALIZATION, IStringAttribute } from "@shapediver/viewer.features.attribute-visualization";
import { SDTF_TYPEHINT } from "@shapediver/viewer.session";
import { IconChevronUp, IconChevronDown } from "@tabler/icons-react";
import React, { useEffect, useState } from "react";
import BaseAttribute from "./BaseAttribute";

interface Props {
	name: string;
	attribute: {
		typeHint: string;
        values?: string[];
	};
	updateAttribute: (attribute: IStringAttribute) => void;
	removeAttribute: (name: string) => void;
	changeOrder: (name: string, direction: "up" | "down") => void;
}

export default function StringAttribute(props: Props) {
	const { attribute: attributeDefinition, name, updateAttribute, removeAttribute, changeOrder } = props;

	const [attribute, setAttribute] = useState<IStringAttribute>({
		key: name,
		type: attributeDefinition.typeHint as SDTF_TYPEHINT,
		values: attributeDefinition.values || [],
		visualization: ATTRIBUTE_VISUALIZATION.BLUE_RED
	});
	const [optionsOpened, setOptionsOpened] = useState(false);
	const [backgroundColor, setBackgroundColor] = useState<string>("");

	useEffect(() => {
		updateAttribute(attribute);

		// Set background color
		if(attribute.visualization === ATTRIBUTE_VISUALIZATION.GRAYSCALE || attribute.visualization === ATTRIBUTE_VISUALIZATION.OPACITY) {
			setBackgroundColor("linear-gradient(90deg, #000000, #ffffff)");
		} else if(attribute.visualization === ATTRIBUTE_VISUALIZATION.HSL) {
			// show full hsl gradient
			setBackgroundColor("linear-gradient(90deg, hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), hsl(360, 100%, 50%))");
		} else {
			setBackgroundColor("linear-gradient(90deg, " + attribute.visualization.replaceAll("_", ", ") + ")");
		}
	}, [attribute]);

	const legend = 					
	<Stack p="xs">
		<Group justify="space-between" onClick={() => setOptionsOpened((t) => !t)}>
			<Text size={"sm"} fw={400} fs="italic" ta="left">
				{optionsOpened ? "Hide Legend" : "Show Legend"}
			</Text>
			{optionsOpened ? <IconChevronUp /> : <IconChevronDown />}
		</Group>
		{optionsOpened && <Stack>
			<Box
				style={{
					width: "100%",
					height: 40,
					borderRadius: 4,
					background: backgroundColor,
				}}
			/>
			<Stack >
				<Group justify="space-between">
					<Text size="xs">{attribute.values[0]}</Text>
					<Text size="xs">{attribute.values[attribute.values.length - 1]}</Text>
				</Group>
			</Stack>
		</Stack>}
	</Stack>;

	return (
		<BaseAttribute
			name={name}
			removeAttribute={removeAttribute}
			changeOrder={changeOrder}
			options={legend}>
			<TextInput
				label="Values"
				value={attribute.values?.join(",")}
				onChange={(event) => {
					setAttribute((prev) => {
						return { ...prev, values: event.currentTarget.value.split(",").map((v) => v.trim()) };
					});
				}}
			/>
			<Select
				label="Visualization"
				value={attribute.visualization}
				data={Object.values(ATTRIBUTE_VISUALIZATION).map((value) => ({ value, label: value.toLocaleUpperCase() }))}
				onChange={(v) => {
					if (!v) return;
					setAttribute((prev) => {
						return { ...prev, visualization: Object.values(ATTRIBUTE_VISUALIZATION).find((value) => value === v)! };
					});
				}}
			/>
		</BaseAttribute>
	);
}
