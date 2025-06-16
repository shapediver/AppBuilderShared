import BaseAttribute from "@AppBuilderShared/components/shapediver/appbuilder/widgets/attributes/BaseAttribute";
import {useShapeDiverStoreAttributeVisualization} from "@AppBuilderShared/store/useShapeDiverStoreAttributeVisualization";
import {INumberAttributeCustomData} from "@AppBuilderShared/types/store/shapediverStoreAttributeVisualization";
import {RangeSlider, RangeSliderValue, Space, Stack} from "@mantine/core";
import {
	ATTRIBUTE_VISUALIZATION,
	Gradient,
	INumberAttribute,
	isNumberGradient,
} from "@shapediver/viewer.features.attribute-visualization";
import React, {useCallback, useEffect, useState} from "react";
import {useShallow} from "zustand/react/shallow";

export type INumberAttributeExtended = INumberAttribute &
	INumberAttributeCustomData;
interface Props {
	widgetId: string;
	name: string;
	attribute: INumberAttributeExtended;
	showLegend?: boolean;
	updateRange: (min: number, max: number) => void;
}

export default function NumberAttribute(props: Props) {
	const {widgetId, attribute, name, updateRange} = props;
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
		const widgetData = customAttributeData[widgetId];
		const customValues = widgetData?.[name + "_" + attribute.type] as
			| INumberAttributeCustomData
			| undefined;

		// Set default values
		if (
			attribute.customMin === undefined ||
			attribute.customMin !== customValues?.customMin
		) {
			if (
				isNumberGradient(attribute.visualization) &&
				attribute.visualization.min !== undefined
			) {
				attribute.customMin = attribute.visualization.min;
			} else {
				attribute.customMin = customValues?.customMin || attribute.min;
			}
		}
		if (
			attribute.customMax === undefined ||
			attribute.customMax !== customValues?.customMax
		) {
			if (
				isNumberGradient(attribute.visualization) &&
				attribute.visualization.max !== undefined
			) {
				attribute.customMax = attribute.visualization.max;
			} else {
				attribute.customMax = customValues?.customMax || attribute.max;
			}
		}

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
			attribute.visualization,
			attribute.min,
			attribute.max,
			attribute.customMin,
			attribute.customMax,
		);
		setGradientColorStops(colorStops);
	}, [widgetId, attribute, customAttributeData]);

	/**
	 * Update the custom min and max values
	 */
	const updateCustomMinMax = useCallback(
		(value: RangeSliderValue) => {
			const [min, max] = value.map((v) => v / multiplyingFactor);
			setMinValue(min + "");
			setMaxValue(max + "");

			// Update the custom attribute data
			updateCustomAttributeData(widgetId, name + "_" + attribute.type, {
				customMin: min,
				customMax: max,
			});

			setGradientColorStops(
				createGradientColorStops(
					attribute.visualization,
					attribute.min,
					attribute.max,
					min,
					max,
				),
			);
		},
		[widgetId, multiplyingFactor, name, attribute],
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
							id={"colorRamp" + widgetId}
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
						fill={"url(#colorRamp" + widgetId + ")"}
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
					step={0.01 * multiplyingFactor}
					marks={[
						attribute.min,
						attribute.customMin!,
						attribute.customMax!,
						attribute.max,
					].map((value) => ({
						value: value * multiplyingFactor,
						label: value?.toFixed(2),
					}))}
				/>
				<Space />
			</Stack>
		</BaseAttribute>
	);
}

const createGradientColorStops = (
	visualization: Gradient,
	min: number,
	max: number,
	customMin: number,
	customMax: number,
): JSX.Element[] => {
	const range = max - min;
	const normalizedMin = (customMin - min) / range;
	const normalizedMax = (customMax - min) / range;

	if (
		visualization === ATTRIBUTE_VISUALIZATION.GRAYSCALE ||
		visualization === ATTRIBUTE_VISUALIZATION.OPACITY
	) {
		// Set the color stops for grayscale and opacity
		return [
			<stop key={0} offset={normalizedMin} stopColor="black" />,
			<stop key={1} offset={normalizedMax} stopColor="white" />,
		];
	} else if (visualization === ATTRIBUTE_VISUALIZATION.HSL) {
		// Set the color stops for HSL
		const hslSamples = 100;
		const colorStops = [];
		for (let i = 0; i < hslSamples; i++) {
			const hue = (i / hslSamples) * 360;
			const color = `hsl(${hue}, 100%, 50%)`;
			colorStops.push(
				<stop
					key={i}
					offset={`${normalizedMin + (normalizedMax - normalizedMin) * (i / (hslSamples - 1))}`}
					stopColor={color}
				/>,
			);
		}
		return colorStops;
	} else if (typeof visualization === "string") {
		// Set the color stops for string visualization
		const data = visualization.split("_");
		if (data.length > 0) {
			const colorStops = data.map((color, index) => (
				<stop
					key={index}
					offset={`${normalizedMin + (normalizedMax - normalizedMin) * (index / (data.length - 1))}`}
					stopColor={color}
				/>
			));
			return colorStops;
		}
	} else if (isNumberGradient(visualization)) {
		// Set the color stops for other visualizations
		const colorStops: JSX.Element[] = [];

		for (let i = 0; i < visualization.steps.length; i++) {
			const step = visualization.steps[i];
			const stepValue = step.value;
			const stepOffset =
				normalizedMin + (normalizedMax - normalizedMin) * stepValue;

			// add two stops, one for the color before the step and one for the color after the step
			colorStops.push(
				<stop
					key={i + "_before"}
					offset={stepOffset}
					stopColor={step.colorBefore}
				/>,
				<stop
					key={i + "_after"}
					offset={stepOffset}
					stopColor={step.colorAfter}
				/>,
			);
		}
		return colorStops;
	}

	return [];
};
