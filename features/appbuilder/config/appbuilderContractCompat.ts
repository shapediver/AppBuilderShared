/**
 * Compile-time checks that App Builder contract stand-in types stay aligned with
 * the third-party types they replace. Imported from `appbuildertypecheck.ts` so
 * `tsc` fails if those types drift. Do not import this module from `appbuilder.ts`.
 */
import {IShapeDiverExportDefinition} from "@AppBuilderLib/entities/export/config/export";
import {IShapeDiverParameterDefinition} from "@AppBuilderLib/entities/parameter/config/parameter";
import {SessionCreateDto} from "@AppBuilderLib/entities/session/config/shapediverStoreSession";
import {IconType} from "@AppBuilderLib/shared/ui/icon/Icon.types";
import {IconifyIcon} from "@iconify/react";
import {
	AreaChartCurveType,
	AreaChartType,
	BarChartType,
	DonutChartCell,
	LineChartCurveType,
} from "@mantine/charts";
import {SliderProps, type MantineColor} from "@mantine/core";
import type {
	IAppBuilderColor,
	IAppBuilderExportDefinition,
	IAppBuilderIcon,
	IAppBuilderIconifyIcon,
	IAppBuilderParameterDefinition,
	IAppBuilderSettingsSession,
	IAppBuilderSliderMark,
	INumberParameterSettings,
} from "./appbuilder";
import type {
	IAppBuilderAreaChartCurveType,
	IAppBuilderAreaChartType,
	IAppBuilderBarChartType,
	IAppBuilderDonutChartCell,
	IAppBuilderLineChartCurveType,
} from "./appbuildercharts";

type Bidirectional<A, B> = [
	A extends B ? true : false,
	B extends A ? true : false,
];

const _checkIconifyIcon: Bidirectional<IAppBuilderIconifyIcon, IconifyIcon> = [
	true,
	true,
];
void _checkIconifyIcon;

const _checkColor: Bidirectional<IAppBuilderColor, MantineColor> = [true, true];
void _checkColor;

const _checkIcon: Bidirectional<IAppBuilderIcon, IconType> = [true, true];
void _checkIcon;

const _checkLineChartCurve: Bidirectional<
	IAppBuilderLineChartCurveType,
	LineChartCurveType
> = [true, true];
void _checkLineChartCurve;

const _checkAreaChartCurve: Bidirectional<
	IAppBuilderAreaChartCurveType,
	AreaChartCurveType
> = [true, true];
void _checkAreaChartCurve;

const _checkAreaChartType: Bidirectional<
	IAppBuilderAreaChartType,
	AreaChartType
> = [true, true];
void _checkAreaChartType;

const _checkBarChartType: Bidirectional<IAppBuilderBarChartType, BarChartType> =
	[true, true];
void _checkBarChartType;

type _AssertSliderMarkAssignable = IAppBuilderSliderMark extends NonNullable<
	SliderProps["marks"]
>[number]
	? true
	: false;
const _checkSliderMark: _AssertSliderMarkAssignable = true;
void _checkSliderMark;

type _AssertSliderContractKeys = Pick<
	SliderProps,
	"marks" | "restrictToMarks" | "step"
>;
type _AssertNumberSettingsToSlider =
	Pick<
		INumberParameterSettings,
		"marks" | "restrictToMarks" | "step"
	> extends _AssertSliderContractKeys
		? true
		: false;
const _checkNumberSettingsSlider: _AssertNumberSettingsToSlider = true;
void _checkNumberSettingsSlider;

const _checkDonutCell: Bidirectional<
	IAppBuilderDonutChartCell,
	DonutChartCell
> = [true, true];
void _checkDonutCell;

const _checkParameterDefinition: Bidirectional<
	IAppBuilderParameterDefinition,
	IShapeDiverParameterDefinition
> = [true, true];
void _checkParameterDefinition;

const _checkExportDefinition: Bidirectional<
	IAppBuilderExportDefinition,
	IShapeDiverExportDefinition
> = [true, true];
void _checkExportDefinition;

const _checkSession: Bidirectional<
	IAppBuilderSettingsSession,
	SessionCreateDto
> = [true, true];
void _checkSession;
