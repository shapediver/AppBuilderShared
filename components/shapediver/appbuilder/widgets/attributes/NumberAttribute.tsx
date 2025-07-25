import BaseAttribute from "@AppBuilderShared/components/shapediver/appbuilder/widgets/attributes/BaseAttribute";
import {useShapeDiverStoreAttributeVisualization} from "@AppBuilderShared/store/useShapeDiverStoreAttributeVisualization";
import {INumberAttributeCustomData} from "@AppBuilderShared/types/store/shapediverStoreAttributeVisualization";
import {
	MantineThemeComponent,
	RangeSlider,
	RangeSliderProps,
	RangeSliderValue,
	Space,
	Stack,
	useProps,
} from "@mantine/core";
import {
	ATTRIBUTE_VISUALIZATION,
	getColorSteps,
	Gradient,
	INumberAttribute,
	isNumberGradient,
} from "@shapediver/viewer.features.attribute-visualization";
import {Converter} from "@shapediver/viewer.session";
import React, {useCallback, useEffect, useMemo, useState} from "react";
import {useShallow} from "zustand/react/shallow";

type StyleProps = {
	rangeSliderProps?: Partial<RangeSliderProps>;
};

const defaultStyleProps: Partial<StyleProps> = {
	rangeSliderProps: {
		pb: "xs",
		styles: {
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
		},
	},
};

type NumberAttributeThemePropsType = Partial<StyleProps>;

export function NumberAttributeThemeProps(
	props: StyleProps,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

export type INumberAttributeExtended = INumberAttribute &
	INumberAttributeCustomData;
interface Props {
	widgetId: string;
	name: string;
	attribute: INumberAttributeExtended;
	showLegend?: boolean;
	updateRange: (min: number, max: number) => void;
}

export default function NumberAttribute(
	props: Props & NumberAttributeThemePropsType,
) {
	const {widgetId, attribute, name, updateRange, ...rest} = props;

	const {rangeSliderProps} = useProps(
		"NumberAttribute",
		defaultStyleProps,
		rest,
	);

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
	const invalidRange = useMemo(() => {
		return (
			absoluteMinValue !== undefined &&
			absoluteMaxValue !== undefined &&
			absoluteMaxValue - absoluteMinValue <= 0
		);
	}, [absoluteMinValue, absoluteMaxValue]);

	const createGradientColorStops = useCallback(
		(visualization: Gradient): JSX.Element[] => {
			if (
				absoluteMinValue === undefined ||
				absoluteMaxValue === undefined
			)
				return [];
			const range = absoluteMaxValue - absoluteMinValue;

			const normalizedMin = invalidRange
				? 0
				: ((customMinValue || absoluteMinValue) - absoluteMinValue) /
					range;
			const normalizedMax = invalidRange
				? 1
				: ((customMaxValue || absoluteMaxValue) - absoluteMinValue) /
					range;

			let parsedVisualization: Gradient = visualization;
			if (
				isNumberGradient(visualization) &&
				typeof visualization.steps === "string"
			)
				parsedVisualization = visualization.steps as Gradient;

			if (parsedVisualization === ATTRIBUTE_VISUALIZATION.OPACITY) {
				// Set the color stops for grayscale and opacity
				return [
					<stop key={0} offset={normalizedMin} stopColor="black" />,
					<stop key={1} offset={normalizedMax} stopColor="white" />,
				];
			} else if (parsedVisualization === ATTRIBUTE_VISUALIZATION.HSL) {
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
			} else if (typeof parsedVisualization === "string") {
				const steps = getColorSteps(parsedVisualization);
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
			} else if (
				isNumberGradient(parsedVisualization) &&
				typeof parsedVisualization.steps !== "string"
			) {
				// Set the color stops for other visualizations
				const colorStops: JSX.Element[] = [];

				for (let i = 0; i < parsedVisualization.steps.length; i++) {
					const step = parsedVisualization.steps[i];
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
		[
			invalidRange,
			customMinValue,
			customMaxValue,
			absoluteMinValue,
			absoluteMaxValue,
		],
	);

	useEffect(() => {
		// Just update the gradient color stops when the custom min and max values change
		const colorStops = createGradientColorStops(attribute.visualization);
		setGradientColorStops(colorStops);

		if (invalidRange) return;
		updateCustomAttributeData(widgetId, name + "_" + attribute.type, {
			customMin: customMinValue,
			customMax: customMaxValue,
			absoluteMin: absoluteMinValue,
			absoluteMax: absoluteMaxValue,
		});
	}, [
		invalidRange,
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
		if (range <= 0) {
			// If the range is zero or negative, set custom min and max to undefined
			// and don't store them in the custom attribute data
			attribute.customMin = undefined;
			attribute.customMax = undefined;
			return;
		}
		setCustomMinValue(attribute.customMin);
		setCustomMaxValue(attribute.customMax);

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
			if (invalidRange) return;
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
		[invalidRange, widgetId, multiplyingFactor, name, attribute],
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
					disabled={invalidRange}
					{...rangeSliderProps}
					label={null}
					value={[
						invalidRange
							? 0
							: (customMinValue ?? 0) * (multiplyingFactor ?? 1),
						invalidRange
							? 1
							: (customMaxValue ?? 0) * (multiplyingFactor ?? 1),
					]}
					onChange={updateCustomMinMax}
					onChangeEnd={(value) => {
						const [min, max] = value.map(
							(v) => v / (multiplyingFactor ?? 1),
						);
						updateRange(min, max);
					}}
					min={
						invalidRange
							? 0
							: (absoluteMinValue ?? 0) * (multiplyingFactor ?? 1)
					}
					max={
						invalidRange
							? 1
							: (absoluteMaxValue ?? 0) * (multiplyingFactor ?? 1)
					}
					step={0.01}
					marks={
						invalidRange
							? [
									{
										value: 0.5,
										label: absoluteMinValue?.toFixed(2),
									},
								]
							: [
									absoluteMinValue,
									customMinValue,
									customMaxValue,
									absoluteMaxValue,
								].map((value) => ({
									value:
										(value ?? 0) * (multiplyingFactor ?? 1),
									label: value?.toFixed(2),
								}))
					}
				/>
				<Space />
			</Stack>
		</BaseAttribute>
	);
}
