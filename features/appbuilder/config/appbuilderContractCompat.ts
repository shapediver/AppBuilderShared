/**
 * Compile-time checks that App Builder contract stand-in types stay aligned with
 * the third-party types they replace, and that Zod schema output stays assignable
 * to the handwritten contract types. Imported from `parseAppBuilderJson.ts` so
 * `tsc` fails if those types drift. Do not import this module from `appbuilder.ts`,
 * `appbuilderagent.ts`, or `appbuildertypecheck.ts`.
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
import {
	SliderProps,
	type MantineColor,
	type MantineTheme,
	type MantineThemeComponent,
} from "@mantine/core";
import type {
	IAppBuilder,
	IAppBuilderActionDefinition,
	IAppBuilderColor,
	IAppBuilderExportDefinition,
	IAppBuilderIcon,
	IAppBuilderIconifyIcon,
	IAppBuilderParameterDefinition,
	IAppBuilderSettingsJson,
	IAppBuilderSettingsSession,
	IAppBuilderSliderMark,
	INumberParameterSettings,
} from "./appbuilder";
import type {GenericToolSettings, IAppBuilderAgent} from "./appbuilderagent";
import type {
	IAppBuilderAreaChartCurveType,
	IAppBuilderAreaChartType,
	IAppBuilderBarChartType,
	IAppBuilderDonutChartCell,
	IAppBuilderLineChartCurveType,
} from "./appbuildercharts";
import type {
	AppBuilderActionDefinitionSchemaOutput,
	AppBuilderAgentSchemaOutput,
	AppBuilderSchemaOutput,
	AppBuilderSettingsJsonSchemaOutput,
	GenericToolSettingsSchemaOutput,
	MantineThemeComponentSchemaOutput,
	MantineThemeFullSchemaOutput,
	MantineThemeOverridePropsSchemaOutput,
} from "./appbuildertypecheck";

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

type _AssertComponentKeys = [
	keyof MantineThemeComponentSchemaOutput extends keyof MantineThemeComponent
		? true
		: false,
	keyof MantineThemeComponent extends keyof MantineThemeComponentSchemaOutput
		? true
		: false,
];
const _checkComponent: _AssertComponentKeys = [true, true];
void _checkComponent;

type _MantineThemeSchemaKeys = keyof MantineThemeFullSchemaOutput;
type _MantineThemeKeys = Exclude<keyof MantineTheme, "variantColorResolver">;
type _AssertThemeKeys = [
	_MantineThemeSchemaKeys extends _MantineThemeKeys ? true : false,
	_MantineThemeKeys extends _MantineThemeSchemaKeys ? true : false,
];
const _checkTheme: _AssertThemeKeys = [true, true];
void _checkTheme;

type _MantineThemeOverridePropsKeys =
	keyof MantineThemeOverridePropsSchemaOutput;
type _AssertThemeOverrideMirrorKeys = [
	_MantineThemeOverridePropsKeys extends _MantineThemeSchemaKeys
		? true
		: false,
	_MantineThemeSchemaKeys extends _MantineThemeOverridePropsKeys
		? true
		: false,
];
const _checkThemeOverrideMirror: _AssertThemeOverrideMirrorKeys = [true, true];
void _checkThemeOverrideMirror;

type _AssertActionDefinition =
	AppBuilderActionDefinitionSchemaOutput extends IAppBuilderActionDefinition
		? true
		: false;
const _checkActionDefinition: _AssertActionDefinition = true;
void _checkActionDefinition;

type _AssertAppBuilderKeys = [
	keyof AppBuilderSchemaOutput extends keyof IAppBuilder ? true : false,
	keyof IAppBuilder extends keyof AppBuilderSchemaOutput ? true : false,
];
const _checkAppBuilder: _AssertAppBuilderKeys = [true, true];
void _checkAppBuilder;

type _AssertAppBuilderOutput = AppBuilderSchemaOutput extends IAppBuilder
	? true
	: false;
const _checkAppBuilderOutput: _AssertAppBuilderOutput = true;
void _checkAppBuilderOutput;

type _AssertSettingsJson =
	AppBuilderSettingsJsonSchemaOutput extends IAppBuilderSettingsJson
		? true
		: false;
const _checkSettingsJson: _AssertSettingsJson = true;
void _checkSettingsJson;

type _AssertAgentOutput = AppBuilderAgentSchemaOutput extends IAppBuilderAgent
	? true
	: false;
const _checkAgentOutput: _AssertAgentOutput = true;
void _checkAgentOutput;

type _AssertGenericToolSettings =
	GenericToolSettingsSchemaOutput extends GenericToolSettings ? true : false;
const _checkGenericToolSettings: _AssertGenericToolSettings = true;
void _checkGenericToolSettings;
