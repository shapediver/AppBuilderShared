import ParameterLabelComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterLabelComponent";
import ParameterWrapperComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterWrapperComponent";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {useFocus} from "@AppBuilderShared/hooks/shapediver/parameters/useFocus";
import {useParameterComponentCommons} from "@AppBuilderShared/hooks/shapediver/parameters/useParameterComponentCommons";
import {
	defaultPropsParameterWrapper,
	PropsParameter,
	PropsParameterWrapper,
} from "@AppBuilderShared/types/components/shapediver/propsParameter";
import {
	Group,
	MantineThemeComponent,
	NumberInput,
	Slider,
	useProps,
} from "@mantine/core";
import {PARAMETER_TYPE} from "@shapediver/viewer.session";
import React, {useCallback, useEffect, useMemo, useState} from "react";

/**
 * Round and clamp the number to the given min, max and step.
 * @param min The minimum allowed value
 * @param max The maximum allowed value
 * @param step The step size, starting from min, to which the value should be clamped
 * @param n The number to round and clamp
 * @returns
 */
const _roundAndClamp = (
	min: number,
	max: number,
	decimalplaces: number,
	step: number,
	n: number,
) => {
	// clamp the number to the min and max
	n = Math.max(min, n);
	n = Math.min(max, n);
	// round the number to the nearest step
	n = Math.round((n - min) / step) * step + min;
	// rounding to the nearest step can result in a number larger than max, so we clamp again
	n = n > max ? n - step : n;
	// CAUTION: this last step converts to a fixed point number with the given decimal places,
	// which can result in a number lower than min!!!
	// This can happen if the given number of decimal places is lower than required
	// to represent the min value correctly.
	return +n.toFixed(decimalplaces);
};

interface StyleProps {
	sliderWidth: string | number | undefined;
	numberWidth: string | number | undefined;
}

export const defaultStyleProps: Partial<StyleProps> = {
	sliderWidth: "60%",
	numberWidth: "35%",
};

type ParameterSliderComponentThemePropsType = Partial<StyleProps>;

export function ParameterSliderComponentThemeProps(
	props: ParameterSliderComponentThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

/**
 * Functional component that creates a slider component for a number parameter.
 * Additionally, a text input is added on the side.
 *
 * @returns
 */
export default function ParameterSliderComponent(
	props: PropsParameter &
		Partial<PropsParameterWrapper> &
		Partial<StyleProps>,
) {
	const {
		definition,
		value,
		setValue,
		handleChange,
		onCancel,
		disabled,
		clearQueuedChange,
		state,
	} = useParameterComponentCommons<number>(props);

	// style properties
	const {sliderWidth, numberWidth} = useProps(
		"ParameterSliderComponent",
		defaultStyleProps,
		props,
	);

	const {wrapperComponent, wrapperProps} = useProps(
		"ParameterSliderComponent",
		defaultPropsParameterWrapper,
		props,
	);

	const {onFocusHandler, onBlurHandler, restoreFocus} = useFocus();

	// calculate the step size which depends on the parameter type
	const step = useMemo(() => {
		if (definition.type === PARAMETER_TYPE.INT) {
			return definition.step !== undefined && definition.step % 1 === 0
				? definition.step
				: 1;
		} else if (
			definition.type === PARAMETER_TYPE.EVEN ||
			definition.type === PARAMETER_TYPE.ODD
		) {
			return definition.step !== undefined && definition.step % 2 === 0
				? definition.step
				: 2;
		} else {
			return definition.step !== undefined
				? +definition.step.toFixed(definition.decimalplaces!)
				: 1 / Math.pow(10, definition.decimalplaces!);
		}
	}, [definition]);

	const roundAndClamp = useCallback(
		(n: number) =>
			_roundAndClamp(
				+definition.min!,
				+definition.max!,
				+definition.decimalplaces!,
				step,
				n,
			),
		[definition, step],
	);

	const valueClamped = roundAndClamp(+value);

	// dummy state for NumberInput value, working around its internal state issues
	const [dummy, setDummy] = useState<{
		// the current value to be shown in the NumberInput
		value: number;
		// the last clamped value, or undefined if no change has been made by the user
		clampedValue: number | undefined;
		// whether to ignore the change
		// (used to forcefully update and reset the NumberInput value, working around its internal state issues)
		ignore: boolean;
		// whether to reset the "ignore the change" flag
		resetIgnore: boolean;
	}>({
		value: valueClamped,
		clampedValue: undefined,
		ignore: false,
		resetIgnore: false,
	});
	// custom variant of handleChange, working around the NumberInput's internal state issues
	const handleChangeCustom = useCallback(
		(
			v: number | undefined,
			timeout: number | undefined,
			lastDummy: typeof dummy,
			cb: () => void = () => {},
		) => {
			if (lastDummy.resetIgnore) {
				setDummy((d) => ({
					...d,
					ignore: false,
					resetIgnore: false,
				}));
				console.log("handleChangeCustom resetIgnore", v, lastDummy);
			}
			if (lastDummy.ignore) {
				console.log("handleChangeCustom ignore", v, lastDummy);
				return;
			}
			// cancel a potential previous queued change
			clearQueuedChange();
			// onValueChange might provide us with an undefined value
			if (v === undefined) {
				setDummy((d) => ({...d, clampedValue: undefined}));
				console.log("handleChangeCustom undefined", v, lastDummy);
				return;
			}
			const _v = roundAndClamp(v);
			console.log("handleChangeCustom", v, _v);
			// If the given value is valid, queue the change.
			// This applies to valid values provided by onValueChange,
			// and to clamped values provided by onBlur or Enter key.
			// If the given value is not valid, store the clamped value
			// but do not queue the change.
			if (_v !== v) {
				setDummy((d) => ({...d, clampedValue: _v}));
			} else {
				setDummy((d) => ({...d, value: _v, clampedValue: _v}));
				handleChange(_v, timeout, () => {
					// call the given callback (typically for restoring the focus)
					cb();
					// below here: workaround for NumberInput issues
					// if the value was at the boundary, we need to forcefully
					// set it to the other boundary and back, to make sure re-rendering happens.
					if (_v >= definition.max!) {
						setDummy({
							value: definition.min!,
							clampedValue: undefined,
							ignore: true,
							resetIgnore: false,
						});
						setTimeout(
							() =>
								setDummy({
									value: _v,
									clampedValue: undefined,
									ignore: true,
									resetIgnore: true,
								}),
							0,
						);
					} else if (_v <= definition.min!) {
						setDummy({
							value: definition.max!,
							clampedValue: undefined,
							ignore: true,
							resetIgnore: false,
						});
						setTimeout(
							() =>
								setDummy({
									value: _v,
									clampedValue: undefined,
									ignore: true,
									resetIgnore: true,
								}),
							0,
						);
					}
				});
			}
		},
		[],
	);

	useEffect(() => {
		setDummy({
			value: valueClamped,
			clampedValue: undefined,
			ignore: true,
			resetIgnore: true,
		});
	}, [valueClamped]);

	// choose width of numeric input based on number of decimals

	// tooltip, marks
	const tooltip = `Min: ${definition.min}, Max: ${definition.max}`;
	const marks = [
		{value: +definition.min!, label: definition.min + ""},
		{value: +definition.max!, label: definition.max + ""},
	];

	return (
		<ParameterWrapperComponent
			onCancel={onCancel}
			component={wrapperComponent}
			{...wrapperProps}
		>
			<ParameterLabelComponent {...props} cancel={onCancel} />
			{definition && (
				<Group justify="space-between" w="100%" wrap="nowrap">
					{definition && (
						<Slider
							w={sliderWidth}
							label={valueClamped}
							value={valueClamped}
							min={+definition.min!}
							max={+definition.max!}
							step={step}
							onChange={(v) => {
								const _v = roundAndClamp(v);
								setValue(_v);
								// make sure the number shown in the NumberInput is updated
								// setDummy((d) => ({
								// 	...d,
								// 	value: _v,
								// 	ignore: true,
								// 	resetIgnore: false,
								// }));
							}}
							onChangeEnd={(v) => {
								handleChange(v, 0, restoreFocus);
								// make sure the number shown in the NumberInput is updated
								// setDummy((d) => ({
								// 	...d,
								// 	value: roundAndClamp(v),
								// 	ignore: true,
								// 	resetIgnore: true,
								// }));
							}}
							marks={marks}
							disabled={disabled}
							thumbProps={{
								onFocus: onFocusHandler,
								onBlur: onBlurHandler,
							}}
						/>
					)}
					{definition && (
						<TooltipWrapper label={tooltip}>
							<NumberInput
								w={numberWidth}
								value={dummy.value}
								min={+definition.min!}
								max={+definition.max!}
								step={step}
								decimalScale={definition.decimalplaces}
								fixedDecimalScale={true}
								clampBehavior="none"
								onValueChange={(v) =>
									handleChangeCustom(
										+v.value,
										undefined,
										dummy,
										restoreFocus,
									)
								}
								disabled={disabled}
								onFocus={onFocusHandler}
								onBlur={() => {
									onBlurHandler();
									handleChangeCustom(
										dummy.clampedValue,
										0,
										dummy,
									);
								}}
								onKeyDown={(event) => {
									if (event.key === "Enter") {
										handleChangeCustom(
											dummy.clampedValue,
											0,
											dummy,
											restoreFocus,
										);
									}
								}}
							/>
						</TooltipWrapper>
					)}
				</Group>
			)}
		</ParameterWrapperComponent>
	);
}
