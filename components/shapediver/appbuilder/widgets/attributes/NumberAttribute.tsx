import BaseAttribute from "@AppBuilderShared/components/shapediver/appbuilder/widgets/attributes/BaseAttribute";
import {useShapeDiverStoreAttributeVisualization} from "@AppBuilderShared/store/useShapeDiverStoreAttributeVisualization";
import {INumberAttributeCustomData} from "@AppBuilderShared/types/store/shapediverStoreAttributeVisualization";
import {RangeSlider, RangeSliderValue, Space, Stack} from "@mantine/core";
import {INumberAttribute} from "@shapediver/viewer.features.attribute-visualization";
import React, {useCallback, useEffect, useState} from "react";
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
	const [multiplyingFactor, setMultiplyingFactor] = useState<number>(0);

	useEffect(() => {
		// Get the custom attribute data
		const customValues = customAttributeData[
			name + "_" + attribute.type
		] as INumberAttributeCustomData | undefined;

		// Set default values
		if (
			attribute.customMin === undefined ||
			attribute.customMin !== customValues?.customMin
		)
			attribute.customMin = customValues?.customMin || attribute.min;
		if (
			attribute.customMax === undefined ||
			attribute.customMax !== customValues?.customMax
		)
			attribute.customMax = customValues?.customMax || attribute.max;

		setMinValue(attribute.customMin + "");
		setMaxValue(attribute.customMax + "");

		const range = attribute.max - attribute.min;

		// find the scaling factor so that the range is 1000
		if (range > 0) {
			setMultiplyingFactor(1000 / range);
		} else {
			setMultiplyingFactor(1);
		}

		const colorStops = createGradientColorStops(
			attribute.visualization as string,
			attribute.min,
			attribute.max,
			attribute.customMin,
			attribute.customMax,
		);
		setGradientColorStops(colorStops);
	}, [attribute, customAttributeData]);

	/**
	 * Update the custom min and max values
	 */
	const updateCustomMinMax = useCallback(
		(value: RangeSliderValue) => {
			const [min, max] = value.map((v) => v / multiplyingFactor);
			setMinValue(min + "");
			setMaxValue(max + "");

			// Update the custom attribute data
			updateCustomAttributeData(name + "_" + attribute.type, {
				customMin: min,
				customMax: max,
			});

			setGradientColorStops(
				createGradientColorStops(
					attribute.visualization as string,
					attribute.min,
					attribute.max,
					min,
					max,
				),
			);
		},
		[multiplyingFactor, name, attribute],
	);

	/**
	 * Create the color legend for the attribute
	 */
	const legend = (
		<Stack>
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
					value={[
						+minValue * multiplyingFactor,
						+maxValue * multiplyingFactor,
					]}
					onChange={updateCustomMinMax}
					onChangeEnd={(value) => {
						const [min, max] = value.map(
							(v) => v / multiplyingFactor,
						);
						updateRange(min, max);
					}}
					min={attribute.min * multiplyingFactor}
					max={attribute.max * multiplyingFactor}
					step={0.001}
					marks={[
						attribute.min,
						attribute.customMin!,
						attribute.customMax!,
						attribute.max,
					].map((value) => ({
						value: value * multiplyingFactor,
						label: value?.toFixed(4),
					}))}
				/>
				<Space />
			</Stack>
		</BaseAttribute>
	);
}

const createGradientColorStops = (
	visualization: string,
	min: number,
	max: number,
	customMin: number,
	customMax: number,
): JSX.Element[] => {
	const range = max - min;
	const normalizedMin = (customMin - min) / range;
	const normalizedMax = (customMax - min) / range;

	return (visualization as string)
		.split("_")
		.map((color, index) => (
			<stop
				key={index}
				offset={`${normalizedMin + (normalizedMax - normalizedMin) * (index / ((visualization as string).split("_").length - 1))}`}
				stopColor={color}
			/>
		));
};
