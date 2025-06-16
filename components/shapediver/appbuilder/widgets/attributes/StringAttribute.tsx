import BaseAttribute from "@AppBuilderShared/components/shapediver/appbuilder/widgets/attributes/BaseAttribute";
import {Box, Group, Stack, Text} from "@mantine/core";
import {
	ATTRIBUTE_VISUALIZATION,
	IStringAttribute,
} from "@shapediver/viewer.features.attribute-visualization";
import React, {useEffect, useState} from "react";

interface Props {
	name: string;
	attribute: IStringAttribute;
	showLegend?: boolean;
	updateAttribute: (attribute: IStringAttribute) => void;
}

export default function StringAttribute(props: Props) {
	const {attribute, name, updateAttribute} = props;
	const [backgroundColor, setBackgroundColor] = useState<string>("");

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
		} else if (typeof attribute.visualization === "string") {
			setBackgroundColor(
				"linear-gradient(90deg, " +
					(attribute.visualization as string).replaceAll("_", ", ") +
					")",
			);
		}
	}, [attribute]);

	const legend = (
		<Stack p="xs">
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
							<Text size="xs">{attribute.values[0]}</Text>
							<Text size="xs">
								{attribute.values[attribute.values.length - 1]}
							</Text>
						</Group>
					</Stack>
				</Stack>
			)}
		</Stack>
	);

	return (
		<BaseAttribute
			name={name}
			type={attribute.type}
			options={legend}
		></BaseAttribute>
	);
}
