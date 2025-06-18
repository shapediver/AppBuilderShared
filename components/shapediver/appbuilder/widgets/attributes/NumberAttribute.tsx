import BaseAttribute from "@AppBuilderShared/components/shapediver/appbuilder/widgets/attributes/BaseAttribute";
import {useShapeDiverStoreAttributeVisualization} from "@AppBuilderShared/store/useShapeDiverStoreAttributeVisualization";
import {INumberAttributeCustomData} from "@AppBuilderShared/types/store/shapediverStoreAttributeVisualization";
import {RangeSlider, RangeSliderValue, Space, Stack} from "@mantine/core";
import {
	ATTRIBUTE_VISUALIZATION,
	getColorSteps,
	Gradient,
	INumberAttribute,
	isNumberGradient,
} from "@shapediver/viewer.features.attribute-visualization";
import {Converter} from "@shapediver/viewer.session";
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
	const [customMinValue, setCustomMinValue] = useState<number>();
	const [customMaxValue, setCustomMaxValue] = useState<number>();

	const [absoluteMinValue, setAbsoluteMinValue] = useState<number>();
	const [absoluteMaxValue, setAbsoluteMaxValue] = useState<number>();
	const [multiplyingFactor, setMultiplyingFactor] = useState<number>();

	const createGradientColorStops = useCallback(
		(visualization: Gradient): JSX.Element[] => {
			if (
				customMinValue === undefined ||
				customMaxValue === undefined ||
				absoluteMinValue === undefined ||
				absoluteMaxValue === undefined
			)
				return [];
			const range = absoluteMaxValue - absoluteMinValue;
			const normalizedMin = (customMinValue - absoluteMinValue) / range;
			const normalizedMax = (customMaxValue - absoluteMinValue) / range;

			if (visualization === ATTRIBUTE_VISUALIZATION.OPACITY) {
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
				const steps = getColorSteps(visualization);
				if (!steps) return [];
				// Set the color steps for string visualization
				const colorStops: JSX.Element[] = [];
				for (let i = 0; i < steps.length; i++) {
					const step = steps[i];
					const stepValue = step.value;
					const stepOffset =
						normalizedMin +
						(normalizedMax - normalizedMin) * stepValue;

					// add two stops, one for the color before the step and one for the color after the step
					colorStops.push(
						<stop
							key={i + "_before"}
							offset={stepOffset}
							stopColor={Converter.instance
								.toHexColor(step.colorBefore)
								.substring(0, 7)}
						/>,
						<stop
							key={i + "_after"}
							offset={stepOffset}
							stopColor={Converter.instance
								.toHexColor(step.colorAfter)
								.substring(0, 7)}
						/>,
					);
				}
				return colorStops;
			} else if (isNumberGradient(visualization)) {
				// Set the color stops for other visualizations
				const colorStops: JSX.Element[] = [];

				for (let i = 0; i < visualization.steps.length; i++) {
					const step = visualization.steps[i];
					const stepValue = step.value;
					const stepOffset =
						normalizedMin +
						(normalizedMax - normalizedMin) * stepValue;

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
		},
		[customMinValue, customMaxValue, absoluteMinValue, absoluteMaxValue],
	);

	useEffect(() => {
		// Just update the gradient color stops when the custom min and max values change
		const colorStops = createGradientColorStops(attribute.visualization);
		setGradientColorStops(colorStops);

		updateCustomAttributeData(widgetId, name + "_" + attribute.type, {
			customMin: customMinValue,
			customMax: customMaxValue,
			absoluteMin: absoluteMinValue,
			absoluteMax: absoluteMaxValue,
		});
	}, [
		customMinValue,
		customMaxValue,
		absoluteMinValue,
		absoluteMaxValue,
		createGradientColorStops,
	]);

	useEffect(() => {
		// Get the custom attribute data
		const widgetData = customAttributeData[widgetId];
		const customValues = widgetData?.[name + "_" + attribute.type] as
			| INumberAttributeCustomData
			| undefined;

		// Set default values
		if (attribute.customMin === undefined) {
			if (
				isNumberGradient(attribute.visualization) &&
				attribute.visualization.min !== undefined
			) {
				attribute.customMin = attribute.visualization.min;
			} else {
				attribute.customMin = customValues?.customMin || attribute.min;
			}
		} else if (
			attribute.customMin !== customValues?.customMin &&
			customValues?.customMin !== undefined
		) {
			attribute.customMin = customValues?.customMin || attribute.min;
		}

		if (attribute.customMax === undefined) {
			if (
				isNumberGradient(attribute.visualization) &&
				attribute.visualization.max !== undefined
			) {
				attribute.customMax = attribute.visualization.max;
			} else {
				attribute.customMax = customValues?.customMax || attribute.max;
			}
		} else if (
			attribute.customMax !== customValues?.customMax &&
			customValues?.customMax !== undefined
		) {
			attribute.customMax = customValues?.customMax || attribute.max;
		}

		setCustomMinValue(attribute.customMin);
		setCustomMaxValue(attribute.customMax);
		const absoluteMin = Math.min(
			Math.min(
				Math.min(attribute.min, attribute.customMin),
				customValues?.absoluteMin || Infinity,
			),
			isNumberGradient(attribute.visualization) &&
				attribute.visualization.min !== undefined
				? attribute.visualization.min
				: Infinity,
		);
		const absoluteMax = Math.max(
			Math.max(
				Math.max(attribute.max, attribute.customMax),
				customValues?.absoluteMax || -Infinity,
			),
			isNumberGradient(attribute.visualization) &&
				attribute.visualization.max !== undefined
				? attribute.visualization.max
				: -Infinity,
		);
		setAbsoluteMinValue(absoluteMin);
		setAbsoluteMaxValue(absoluteMax);

		const range = absoluteMax - absoluteMin;

		// find the scaling factor so that the range is 1000
		if (range > 0) {
			setMultiplyingFactor(1000 / range);
		} else {
			setMultiplyingFactor(1);
		}
	}, [widgetId, attribute, customAttributeData]);

	/**
	 * Update the custom min and max values
	 */
	const updateCustomMinMax = useCallback(
		(value: RangeSliderValue) => {
			if (multiplyingFactor === undefined) return;
			const [min, max] = value.map((v) => v / multiplyingFactor);
			attribute.customMin = min;
			attribute.customMax = max;
			setCustomMinValue(min);
			setCustomMaxValue(max);

			// Update the custom attribute data
			updateCustomAttributeData(widgetId, name + "_" + attribute.type, {
				customMin: min,
				customMax: max,
				absoluteMin: absoluteMinValue,
				absoluteMax: absoluteMaxValue,
			});
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
						(customMinValue ?? 0) * (multiplyingFactor ?? 1),
						(customMaxValue ?? 0) * (multiplyingFactor ?? 1),
					]}
					onChange={updateCustomMinMax}
					onChangeEnd={(value) => {
						const [min, max] = value.map(
							(v) => v / (multiplyingFactor ?? 1),
						);
						updateRange(min, max);
					}}
					min={(absoluteMinValue ?? 0) * (multiplyingFactor ?? 1)}
					max={(absoluteMaxValue ?? 0) * (multiplyingFactor ?? 1)}
					step={0.01}
					styles={{
						markLabel: {
							transform: `translate( 
								calc(-50% + /* default offset */
									max(0%, calc(5% - var(--mark-offset))) * 5 - /* if under 5%, add up to 50% */
									max(0%, calc(var(--mark-offset) - 95%)) * 5 + /* if over 95%, subtract up to 50% */
									var(--slider-size) / 2 
								), 
								calc(var(--mantine-spacing-xs) / 2) 
								)`,
						},
					}}
					marks={[
						absoluteMinValue,
						customMinValue,
						customMaxValue,
						absoluteMaxValue,
					].map((value) => ({
						value: (value ?? 0) * (multiplyingFactor ?? 1),
						label: value?.toFixed(2),
					}))}
				/>
				<Space />
			</Stack>
		</BaseAttribute>
	);
}
