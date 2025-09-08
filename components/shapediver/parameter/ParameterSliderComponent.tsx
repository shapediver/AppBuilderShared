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
import {validateNumberParameterSettings} from "@AppBuilderShared/types/shapediver/appbuildertypecheck";
import {
	Group,
	MantineThemeComponent,
	NumberInput,
	Slider,
	useProps,
} from "@mantine/core";
import {PARAMETER_TYPE} from "@shapediver/viewer.session";
import React, {useCallback, useEffect, useMemo, useState} from "react";

interface NumberFormatValues {
	/** The value converted to a float, if valid. */
	floatValue: number | undefined;
	/** The value currently displayed. */
	value: string;
}

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
	const {definition, value, setValue, handleChange, onCancel, disabled} =
		useParameterComponentCommons<number>(props);

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
		const result = validateNumberParameterSettings(definition?.settings);
		const _step = result.success
			? (result.data.step ?? definition.step)
			: definition.step;
		if (definition.type === PARAMETER_TYPE.INT) {
			return _step !== undefined && _step % 1 === 0 ? _step : 1;
		} else if (
			definition.type === PARAMETER_TYPE.EVEN ||
			definition.type === PARAMETER_TYPE.ODD
		) {
			return _step !== undefined && _step % 2 === 0 ? _step : 2;
		} else {
			return _step !== undefined
				? +_step.toFixed(definition.decimalplaces!)
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

	// State for the NumberInput component
	const [niState, setNiState] = useState<{
		/** Latest change event data. */
		latest: NumberFormatValues;
		/** Latest valid (clamped) value input by the user which has not been committed yet. */
		valid: number | undefined;
		/** Previous valid (clamped) value. */
		previous: number;
	}>({
		latest: {
			value: "" + valueClamped,
			floatValue: undefined,
		},
		valid: undefined,
		previous: valueClamped,
	});

	/** Handler for value changes of the NumberInput component */
	const onNumberInputValueChange = useCallback((v: NumberFormatValues) => {
		const clamped =
			v.floatValue !== undefined
				? roundAndClamp(v.floatValue)
				: undefined;
		setNiState((s) => ({
			...s,
			latest: v,
			valid:
				v.floatValue !== undefined && clamped === v.floatValue
					? clamped
					: undefined,
		}));
	}, []);

	/**
	 * Commit changes for the NumberInput component, called if the
	 * user hits enter or the input looses focus.
	 */
	const commitNumberInput = useCallback(
		(
			state: typeof niState,
			blurEvent?: React.FocusEvent<HTMLInputElement>,
		) => {
			if (state.valid !== undefined) {
				setNiState({
					valid: undefined,
					previous: state.valid!,
					latest: {
						value: "" + state.valid,
						floatValue: undefined,
					},
				});
				handleChange(
					state.valid,
					0,
					blurEvent ? undefined : restoreFocus,
				);
				if (blurEvent) onBlurHandler();
				//console.debug(`Committing change to ${state.valid}`);
				return;
			}
			if (state.latest.floatValue === undefined) {
				if (blurEvent) {
					if ("" + state.previous !== state.latest.value) {
						setNiState({
							latest: {
								value: "" + state.previous,
								floatValue: undefined,
							},
							valid: undefined,
							previous: state.previous,
						});
						blurEvent.target.focus();
						//console.debug(`Resetting value to ${state.previous}`);
					}
				}
				return;
			}
			const clamped = roundAndClamp(state.latest.floatValue);
			setNiState({
				...state,
				latest: {
					value: "" + clamped,
					floatValue: undefined,
				},
				valid: clamped,
			});
			blurEvent?.target.focus();
			//console.debug(`Clamping ${state.latest.floatValue} to ${clamped}`);
		},
		[],
	);

	/** Reset changes to the NumberInput component. */
	const resetNumberInput = useCallback(
		(state: typeof niState) => {
			if ("" + state.previous !== state.latest.value) {
				setNiState({
					previous: state.previous,
					latest: {
						value: "" + state.previous,
						floatValue: undefined,
					},
					valid: undefined,
				});
			} else {
				onCancel?.();
			}
		},
		[onCancel],
	);

	// update the NumberInput state if the value changes from outside, or from the slider
	useEffect(() => {
		setNiState({
			latest: {
				value: "" + valueClamped,
				floatValue: undefined,
			},
			valid: undefined,
			previous: valueClamped,
		});
	}, [valueClamped]);

	// TODO: choose width of numeric input based on number of decimals

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
							onChange={(v) => setValue(roundAndClamp(v))}
							onChangeEnd={(v) =>
								handleChange(roundAndClamp(v), 0, restoreFocus)
							}
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
								value={niState.latest.value}
								min={+definition.min!}
								max={+definition.max!}
								step={step}
								decimalScale={definition.decimalplaces}
								fixedDecimalScale={true}
								clampBehavior="none"
								onValueChange={onNumberInputValueChange}
								disabled={disabled}
								onFocus={onFocusHandler}
								onBlur={(event) =>
									commitNumberInput(niState, event)
								}
								onKeyDown={(event) => {
									if (event.key === "Enter") {
										commitNumberInput(niState);
									} else if (event.key === "Escape") {
										resetNumberInput(niState);
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
