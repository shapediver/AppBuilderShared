import TooltipWrapper from "@AppBuilderLib/shared/ui/tooltip/TooltipWrapper";
import {
	Group,
	MantineThemeComponent,
	NumberInput,
	type NumberInputProps,
	Slider,
	useProps,
} from "@mantine/core";
import {PARAMETER_TYPE} from "@shapediver/viewer.session";
import React, {useCallback, useEffect, useMemo, useState} from "react";
import {
	defaultPropsParameterWrapper,
	PropsParameterComponent,
	PropsParameterWrapper,
} from "../config/propsParameter";
import {
	getAdjacentMarkValue,
	roundAndClampParameterValue,
} from "../lib/parameterSliderMarks";
import {useFocus} from "../model/useFocus";
import {useParameterComponentCommons} from "../model/useParameterComponentCommons";
import {useSettingsMinMax} from "../model/useSettingsMinMax";
import ParameterLabelComponent from "./ParameterLabelComponent";
import ParameterWrapperComponent from "./ParameterWrapperComponent";
import type {ParameterSliderComponentThemeDefaultProps} from "./ParameterSliderComponent.types";

type OnNumberInputValueChange = NonNullable<NumberInputProps["onValueChange"]>;

interface NumberFormatValues {
	/** The value converted to a float, if valid. */
	floatValue: number | undefined;
	/** The value currently displayed. */
	value: string;
}

export const defaultStyleProps = {
	sliderWidth: "60%",
	numberWidth: "35%",
} as const satisfies ParameterSliderComponentThemeDefaultProps;

type ParameterSliderComponentThemePropsType =
	Partial<ParameterSliderComponentThemeDefaultProps>;

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
	props: PropsParameterComponent &
		Partial<PropsParameterWrapper> &
		Partial<ParameterSliderComponentThemeDefaultProps>,
) {
	const {
		definition,
		value,
		setValue,
		handleChange,
		onCancel,
		disabled,
		formInputProps,
		formKey,
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

	const {validatedSettings, min, max} = useSettingsMinMax(definition);
	const {onFocusHandler, onBlurHandler, restoreFocus} = useFocus();

	// calculate the step size which depends on the parameter type
	const step = useMemo(() => {
		const _step = validatedSettings.success
			? (validatedSettings.data.step ?? definition.step)
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
	}, [definition, validatedSettings]);

	const settingsMarks = useMemo(
		() =>
			validatedSettings.success
				? validatedSettings.data.marks
				: undefined,
		[validatedSettings],
	);

	// Prefer provided marks; otherwise fall back to min/max and keep only marks within range
	const sliderMarks = useMemo(() => {
		const providedMarks =
			settingsMarks && settingsMarks.length > 0
				? settingsMarks
				: undefined;
		const fallbackMarks = [
			{value: +min!, label: min + ""},
			{value: +max!, label: max + ""},
		];
		// pick provided marks or fallback, then drop anything outside min/max
		return (providedMarks ?? fallbackMarks).filter((mark) => {
			return mark.value >= +min! && mark.value <= +max!;
		});
	}, [settingsMarks, definition, min, max]);

	const restrictToMarks = useMemo(
		() =>
			!!(
				validatedSettings.success &&
				validatedSettings.data.restrictToMarks &&
				sliderMarks.length
			),
		[validatedSettings, sliderMarks],
	);

	const roundAndClamp = useCallback(
		(n: number) =>
			roundAndClampParameterValue(
				+definition.min!,
				+definition.max!,
				+definition.decimalplaces!,
				step,
				n,
				restrictToMarks,
				sliderMarks,
			),
		[definition, step, restrictToMarks, sliderMarks],
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
	const onNumberInputValueChange: OnNumberInputValueChange = useCallback(
		(v, sourceInfo) => {
			// Mantine passes increment/decrement; react-number-format types only event/prop.
			const source = sourceInfo.source as string;
			if (
				restrictToMarks &&
				(source === "increment" || source === "decrement")
			) {
				const direction = source === "increment" ? "up" : "down";
				setNiState((s) => {
					const base = s.valid ?? s.previous;
					const next = getAdjacentMarkValue(
						base,
						sliderMarks,
						direction,
						+definition.min!,
						+definition.max!,
						+definition.decimalplaces!,
					);
					return {
						...s,
						latest: {
							value: "" + next,
							floatValue: next,
						},
						valid: next,
					};
				});
				return;
			}
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
		},
		[restrictToMarks, sliderMarks, definition, roundAndClamp],
	);

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
				//Logger.debug(`Committing change to ${state.valid}`);
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
						//Logger.debug(`Resetting value to ${state.previous}`);
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
			//Logger.debug(`Clamping ${state.latest.floatValue} to ${clamped}`);
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
							min={min}
							max={max}
							step={step}
							onChange={(v) => setValue(roundAndClamp(v))}
							onChangeEnd={(v) =>
								handleChange(roundAndClamp(v), 0, restoreFocus)
							}
							marks={sliderMarks}
							restrictToMarks={restrictToMarks}
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
								key={formKey}
								{...(formInputProps || {})}
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
								onFocus={(e) => {
									onFocusHandler(e);
									if (formInputProps?.onFocus) {
										formInputProps.onFocus(e);
									}
								}}
								onBlur={(event) => {
									commitNumberInput(niState, event);
									if (formInputProps?.onBlur) {
										formInputProps.onBlur();
									}
								}}
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
