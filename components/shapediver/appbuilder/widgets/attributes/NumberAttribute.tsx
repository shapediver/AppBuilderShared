import BaseAttribute from "@AppBuilderShared/components/shapediver/appbuilder/widgets/attributes/BaseAttribute";
import {RangeSlider, Space, Stack} from "@mantine/core";
import {INumberAttribute} from "@shapediver/viewer.features.attribute-visualization";
import React, {useEffect, useState} from "react";
export type INumberAttributeExtended = INumberAttribute & {
	defaultMin?: number;
	defaultMax?: number;
};
interface Props {
	name: string;
	attribute: INumberAttributeExtended;
	showLegend?: boolean;
	updateRange: (min: number, max: number) => void;
}

export default function NumberAttribute(props: Props) {
	const {attribute, name, updateRange} = props;

	const [gradientColorStops, setGradientColorStops] =
		useState<JSX.Element[]>();
	const [minValue, setMinValue] = useState<string>(attribute.min + "");
	const [maxValue, setMaxValue] = useState<string>(attribute.max + "");

	useEffect(() => {
		// Set default values
		if (attribute.defaultMin === undefined)
			attribute.defaultMin = attribute.min;
		if (attribute.defaultMax === undefined)
			attribute.defaultMax = attribute.max;

		setMinValue(attribute.min + "");
		setMaxValue(attribute.max + "");

		const range = attribute.defaultMax - attribute.defaultMin;
		const normalizedMin = (attribute.min - attribute.defaultMin) / range;
		const normalizedMax = (attribute.max - attribute.defaultMin) / range;

		const colorStops = (attribute.visualization as string)
			.split("_")
			.map((color, index) => (
				<stop
					key={index}
					offset={`${normalizedMin + (normalizedMax - normalizedMin) * (index / ((attribute.visualization as string).split("_").length - 1))}`}
					stopColor={color}
				/>
			));
		setGradientColorStops(colorStops);
	}, [attribute]);

	/**
	 * Create the color legend for the attribute
	 */
	const legend = (
		<Stack pt="xs">
			{(props.showLegend ?? true) && (
				<svg width="100%" height="50">
					<defs>
						<linearGradient
							id="colorRamp"
							x1="0%"
							y1="0%"
							x2="100%"
							y2="0%"
						>
							{gradientColorStops}
						</linearGradient>
					</defs>
					<rect
						x="0"
						y="0"
						width="100%"
						height="100%"
						fill="url(#colorRamp)"
					/>
				</svg>
			)}
		</Stack>
	);

	return (
		<BaseAttribute name={name} type={attribute.type}>
			<Stack>
				{legend}
				<RangeSlider
					pb="xs"
					label={null}
					value={[+minValue, +maxValue]}
					onChange={(value) => {
						setMinValue(value[0] + "");
						setMaxValue(value[1] + "");
						updateRange(value[0], value[1]);
					}}
					min={attribute.defaultMin}
					max={attribute.defaultMax}
					step={0.01}
					marks={[
						{
							value: attribute.defaultMin!,
							label: attribute.defaultMin,
						},
						{value: attribute.min, label: attribute.min},
						{value: attribute.max, label: attribute.max},
						{
							value: attribute.defaultMax!,
							label: attribute.defaultMax,
						},
					]}
				/>
				<Space />
			</Stack>
		</BaseAttribute>
	);
}
