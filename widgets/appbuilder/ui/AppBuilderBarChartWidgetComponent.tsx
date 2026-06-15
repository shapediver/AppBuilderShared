import {
	convertChartData,
	IAppBuilderWidgetPropsBarChart,
} from "@AppBuilderLib/features/appbuilder/config/appbuildercharts";
import type {MantineBarChartProps} from "@AppBuilderLib/shared/mantine-props/barChart";
import type {MantinePaperProps} from "@AppBuilderLib/shared/mantine-props/paper";
import type {MantineTitleProps} from "@AppBuilderLib/shared/mantine-props/title";
import {BarChart} from "@mantine/charts";
import {MantineThemeComponent, Paper, Title, useProps} from "@mantine/core";
import React from "react";

/**
 * @docAttached
 * @category widget
 * @configPath themeOverrides.components.AppBuilderBarChartWidgetComponent.defaultProps
 * @displayName AppBuilderBarChartWidgetComponent
 */
export interface AppBuilderBarChartWidgetComponentStyleProps {
	widgetProps?: MantinePaperProps;
	titleProps?: MantineTitleProps;
	barChartProps?: MantineBarChartProps;
}

const defaultStyleProps: Partial<AppBuilderBarChartWidgetComponentStyleProps> = {
	widgetProps: {},
	titleProps: {
		style: {marginBottom: "20px"},
	},
	barChartProps: {
		h: 250,
	},
};

type AppBuilderBarChartWidgetComponentThemePropsType = Partial<AppBuilderBarChartWidgetComponentStyleProps>;

export function AppBuilderBarChartWidgetComponentThemeProps(
	props: AppBuilderBarChartWidgetComponentThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

export default function AppBuilderBarChartWidgetComponent(
	props: IAppBuilderWidgetPropsBarChart &
		AppBuilderBarChartWidgetComponentThemePropsType,
) {
	const {name, type, plotSettings, data, ...rest} = props;

	const {widgetProps, titleProps, barChartProps} = useProps(
		"AppBuilderBarChartWidgetComponent",
		defaultStyleProps,
		rest,
	);

	return (
		<Paper {...widgetProps}>
			<Title {...titleProps}>{name}</Title>
			<BarChart
				{...barChartProps}
				withXAxis={plotSettings.xaxis}
				xAxisLabel={plotSettings.xlabel}
				withYAxis={plotSettings.yaxis}
				yAxisLabel={plotSettings.ylabel}
				gridAxis={plotSettings.grid}
				tickLine={plotSettings.grid}
				withLegend={plotSettings.legend}
				data={convertChartData(data)}
				dataKey="key"
				type={type}
				series={data.series}
			/>
		</Paper>
	);
}
