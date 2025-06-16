import BaseAttribute from "@AppBuilderShared/components/shapediver/appbuilder/widgets/attributes/BaseAttribute";
import {Badge} from "@mantine/core";
import {
	AttributeVisualizationUtils,
	isStringGradient,
	IStringAttribute,
	IStringGradient,
} from "@shapediver/viewer.features.attribute-visualization";
import {Converter, MaterialStandardData} from "@shapediver/viewer.session";
import React, {useMemo} from "react";

interface Props {
	name: string;
	attribute: IStringAttribute;
	showLegend?: boolean;
}

export default function StringAttribute(props: Props) {
	const {attribute, name} = props;

	const legend = useMemo(() => {
		const colorToValueDictionary: {
			[key: string]: {
				value: string;
				count: number;
			}[];
		} = {};

		attribute.values.forEach((item) => {
			if (typeof attribute.visualization === "string") {
				const data = AttributeVisualizationUtils.stringVisualization(
					item,
					attribute.values,
					attribute.visualization,
					"standard",
					new MaterialStandardData(),
				);
				const c = Converter.instance.toHexColor(data?.material.color);
				if (colorToValueDictionary[c] === undefined) {
					colorToValueDictionary[c] = [
						{
							value: item,
							count: 1,
						},
					];
				} else {
					const existingValue = colorToValueDictionary[c].find(
						(v) => v.value === item,
					);
					if (existingValue === undefined) {
						colorToValueDictionary[c].push({
							value: item,
							count: 1,
						});
					} else {
						existingValue.count++;
					}
				}
			} else if (isStringGradient(attribute.visualization)) {
				const gradient = attribute.visualization as IStringGradient;
				gradient.labelColors.map((color) => {
					if (color.values.includes(item)) {
						const c = Converter.instance.toHexColor(color.color);
						if (colorToValueDictionary[c] === undefined) {
							colorToValueDictionary[c] = [
								{
									value: item,
									count: 1,
								},
							];
						} else {
							const existingValue = colorToValueDictionary[
								c
							].find((v) => v.value === item);
							if (existingValue === undefined) {
								colorToValueDictionary[c].push({
									value: item,
									count: 1,
								});
							} else {
								existingValue.count++;
							}
						}
					}
				});
			}
		});

		// create badge array
		return Object.entries(colorToValueDictionary)
			.map(([color, value], index) => {
				return value.map((v) => {
					return (
						<Badge
							autoContrast
							key={JSON.stringify(v) + index}
							style={{marginRight: "10px"}} // TODO make this a style prop
							color={color}
						>
							{v.count > 1
								? v.value + " (" + v.count + ")"
								: v.value}
						</Badge>
					);
				});
			})
			.flat();
	}, [attribute]);

	return (
		<BaseAttribute
			name={name}
			type={attribute.type}
			options={legend}
		></BaseAttribute>
	);
}
