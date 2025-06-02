import BaseAttribute from "@AppBuilderShared/components/shapediver/appbuilder/widgets/attributes/BaseAttribute";
import {useShapeDiverStoreAttributeVisualization} from "@AppBuilderShared/store/useShapeDiverStoreAttributeVisualization";
import {INumberAttributeCustomData} from "@AppBuilderShared/types/store/shapediverStoreAttributeVisualization";
import {RangeSlider, RangeSliderValue, Space, Stack} from "@mantine/core";
import {INumberAttribute} from "@shapediver/viewer.features.attribute-visualization";
import React, {useEffect, useState} from "react";
import {useShallow} from "zustand/react/shallow";

export type INumberAttributeExtended = INumberAttribute &
	INumberAttributeCustomData;
interface Props {
	name: string;
	attribute: INumberAttributeExtended;
	showLegend?: boolean;
	updateRange: (min: number, max: number) => void;
}

export default function NumberAttribute(props: Props) {
	const {attribute, name, updateRange} = props;
	const {updateCustomAttributeData, customAttributeData} =
		useShapeDiverStoreAttributeVisualization(
			useShallow((state) => ({
				updateCustomAttributeData: state.updateCustomAttributeData,
				customAttributeData: state.customAttributeData,
			})),
		);

	const [gradientColorStops, setGradientColorStops] =
		useState<JSX.Element[]>();
	const [minValue, setMinValue] = useState<string>(attribute.min + "");
	const [maxValue, setMaxValue] = useState<string>(attribute.max + "");

	useEffect(() => {
		// Get the custom attribute data
		const customValues = customAttributeData[
			name + "_" + attribute.type
		] as INumberAttributeCustomData | undefined;

		// Set default values
		if (attribute.customMin === undefined)
			attribute.customMin = customValues?.customMin || attribute.min;
		if (attribute.customMax === undefined)
			attribute.customMax = customValues?.customMax || attribute.max;

		setMinValue(attribute.customMin + "");
		setMaxValue(attribute.customMax + "");

		const range = attribute.max - attribute.min;
		const normalizedMin = (attribute.customMin - attribute.min) / range;
		const normalizedMax = (attribute.customMax - attribute.min) / range;

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
	}, [attribute, customAttributeData]);

	/**
	 * Update the custom min and max values
	 */
	const updateCustomMinMax = (value: RangeSliderValue) => {
		setMinValue(value[0] + "");
		setMaxValue(value[1] + "");
		updateRange(value[0], value[1]);

		// Update the custom attribute data
		updateCustomAttributeData(name + "_" + attribute.type, {
			customMin: value[0],
			customMax: value[1],
		});
	};

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
					onChange={updateCustomMinMax}
					min={attribute.min}
					max={attribute.max}
					step={0.01}
					marks={[
						{
							value: attribute.min,
							label: attribute.min,
						},
						{
							value: attribute.customMin!,
							label: attribute.customMin,
						},
						{
							value: attribute.customMax!,
							label: attribute.customMax,
						},
						{
							value: attribute.max,
							label: attribute.max,
						},
					]}
				/>
				<Space />
			</Stack>
		</BaseAttribute>
	);
}
