import type {IShapeDiverParameterDefinition} from "@AppBuilderLib/entities/parameter/config/parameter";
import {validateNumberParameterSettings} from "@AppBuilderLib/features/appbuilder/config/appbuildertypecheck";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import {
	roundAndClampParameterValue,
	type ParameterSliderMark,
} from "./parameterSliderMarks";

const NUMERIC_TYPES = new Set<string>([
	ResParameterType.INT,
	ResParameterType.FLOAT,
	ResParameterType.EVEN,
	ResParameterType.ODD,
]);

export function isNumericSliderParameter(type: string | undefined): boolean {
	return type != null && NUMERIC_TYPES.has(type);
}

function decimalPlaces(definition: {decimalplaces?: number | null}): number {
	const places = definition.decimalplaces;
	return typeof places === "number" && Number.isFinite(places) ? places : 0;
}

/**
 * Step the slider uses: settings step, otherwise the parameter step,
 * otherwise a type default (1, 2, or one unit in the last decimal place).
 */
export function numericSliderStep(
	definition: Pick<
		IShapeDiverParameterDefinition,
		"type" | "step" | "decimalplaces" | "settings"
	>,
): number {
	const validated = validateNumberParameterSettings(definition.settings);
	const raw = validated.success
		? (validated.data.step ?? definition.step)
		: definition.step;
	const places = decimalPlaces(definition);
	if (definition.type === ResParameterType.INT) {
		return raw !== undefined && raw % 1 === 0 ? raw : 1;
	}
	if (
		definition.type === ResParameterType.EVEN ||
		definition.type === ResParameterType.ODD
	) {
		return raw !== undefined && raw % 2 === 0 ? raw : 2;
	}
	return raw !== undefined ? +raw.toFixed(places) : 1 / Math.pow(10, places);
}

/** Settings may only narrow the parameter range. Inverted overrides are swapped. */
export function narrowSliderBounds(
	defMin: number,
	defMax: number,
	settingsMin: number | undefined,
	settingsMax: number | undefined,
): {min: number; max: number} {
	let min =
		settingsMin !== undefined
			? Math.min(defMax, Math.max(defMin, settingsMin))
			: defMin;
	let max =
		settingsMax !== undefined
			? Math.max(defMin, Math.min(defMax, settingsMax))
			: defMax;
	if (min > max) {
		[min, max] = [max, min];
	}
	return {min, max};
}

export type NumericSliderControls = {
	step: number;
	marks: ParameterSliderMark[];
	restrictToMarks: boolean;
	project: (value: number) => number;
};

/**
 * The same step, marks, and rounding the slider control uses when it
 * displays and commits a number.
 */
export function numericSliderControls(
	definition: IShapeDiverParameterDefinition,
): NumericSliderControls {
	const step = numericSliderStep(definition);
	const places = decimalPlaces(definition);
	const defMin =
		typeof definition.min === "number" ? definition.min : undefined;
	const defMax =
		typeof definition.max === "number" ? definition.max : undefined;
	if (defMin === undefined || defMax === undefined) {
		return {
			step,
			marks: [],
			restrictToMarks: false,
			project: (value) => value,
		};
	}

	const validated = validateNumberParameterSettings(definition.settings);
	const bounds = narrowSliderBounds(
		defMin,
		defMax,
		validated.success ? validated.data.min : undefined,
		validated.success ? validated.data.max : undefined,
	);
	const settingsMarks = validated.success ? validated.data.marks : undefined;
	const provided =
		settingsMarks && settingsMarks.length > 0 ? settingsMarks : undefined;
	const fallback: ParameterSliderMark[] = [
		{value: bounds.min, label: String(bounds.min)},
		{value: bounds.max, label: String(bounds.max)},
	];
	const marks = (provided ?? fallback).filter(
		(mark) => mark.value >= bounds.min && mark.value <= bounds.max,
	);
	const restrictToMarks = !!(
		validated.success &&
		validated.data.restrictToMarks &&
		marks.length
	);

	return {
		step,
		marks,
		restrictToMarks,
		project: (value) =>
			roundAndClampParameterValue(
				defMin,
				defMax,
				places,
				step,
				value,
				restrictToMarks,
				marks,
			),
	};
}

/** Slider value for a numeric parameter, or undefined when it is not one. */
export function projectNumericSliderValue(
	definition: IShapeDiverParameterDefinition,
	value: number,
): number | undefined {
	if (!isNumericSliderParameter(definition.type)) return undefined;
	return numericSliderControls(definition).project(value);
}
