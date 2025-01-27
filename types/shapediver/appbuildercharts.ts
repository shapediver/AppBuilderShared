import {
	AreaChartCurveType,
	AreaChartType,
	BarChartType,
	DonutChartCell,
	LineChartCurveType,
} from "@mantine/charts";

/** Properties of round chart widget */
export interface IAppBuilderWidgetPropsRoundChart {
	/** Name used as a title of the chart */
	name?: string;
	/** Use a pie chart or donut chart, defaults to "donut" chart */
	style: "pie" | "donut";
	/** Whether or not to display labels, true by default */
	labels?: boolean;
	/** Whether or not to display badges for the legend, true by default */
	legend?: boolean;
	/** Data set used for the chart */
	data: DonutChartCell[];
}

/**
 * Plot settings common to Line, Area and Bar charts
 */
export interface IAppBuilderWidgetPropsChartPlotSettings {
	/** Determines whether x-axis should be displayed, true by default */
	xaxis?: boolean;
	/** A label to display below the x-axis */
	xlabel?: string;
	/** Determines whether y-axis should be displayed, true by default */
	yaxis?: boolean;
	/** A label to display below the y-axis */
	ylabel?: string;
	/** Specifies which lines should be displayed in the grid, 'x' by default */
	grid?: "none" | "x" | "y" | "xy";
	/** Determines whether dots should be displayed, true by default */
	dots?: boolean;
	/** Determines whether chart legend should be displayed, false by default */
	legend?: boolean;
}

/**
 * Data sets common to  Line, Area and Bar charts
 * We have our own data set representation which is much more compact and explicit regarding the plugin components.
 */
export interface IAppBuilderWidgetPropsChartDataSet {
	keys: string[];
	series: {
		name: string;
		color: string;
		values: number[];
	}[];
}

/**
 * Common properties of line, area, and bar chart widgets
 */
export interface IAppBuilderWidgetPropsChartCommon {
	/** Name used as a title of the chart */
	name?: string;
	/** Plot settings */
	plotSettings: IAppBuilderWidgetPropsChartPlotSettings;
	/** Data set used for the chart */
	data: IAppBuilderWidgetPropsChartDataSet;
}

/** Properties of line chart widget */
export interface IAppBuilderWidgetPropsLineChart
	extends IAppBuilderWidgetPropsChartCommon {
	/** Type of the curve, 'monotone' by default. */
	style?: LineChartCurveType;
}

/** Properties of area chart widget */
export interface IAppBuilderWidgetPropsAreaChart
	extends IAppBuilderWidgetPropsChartCommon {
	/** Style of the plotted curve, 'monotone' by default */
	style?: AreaChartCurveType;
	/** Controls how chart areas are positioned relative to each other, 'default' by default */
	type?: AreaChartType;
}

/** Properties of bar chart widget */
export interface IAppBuilderWidgetPropsBarChart
	extends IAppBuilderWidgetPropsChartCommon {
	/** Controls how bars are positioned relative to each other, 'default' by default */
	type?: BarChartType;
}

/**
 * Our data set type needs to be converted to the chart series type of Mantine.
 * Matine's representation includes a lot of redundancy.
 * @param dataSet
 * @returns
 */
export function convertChartData(dataSet: IAppBuilderWidgetPropsChartDataSet) {
	const {keys, series} = dataSet;
	const convertedDataSet = keys.map((key, index) => {
		const dataPoint: {[key: string]: string | number} = {key};
		series.forEach((serie) => {
			dataPoint[serie.name] = serie.values[index];
		});

		return dataPoint;
	});

	return convertedDataSet;
}
