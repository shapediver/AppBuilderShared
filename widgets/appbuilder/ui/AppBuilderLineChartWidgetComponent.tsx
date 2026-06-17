import {
	convertChartData,
	IAppBuilderWidgetPropsLineChart,
} from "@AppBuilderLib/features/appbuilder/config/appbuildercharts";
import type {MantineLineChartProps} from "@AppBuilderLib/shared/mantine-props/lineChart";
import type {MantinePaperProps} from "@AppBuilderLib/shared/mantine-props/paper";
import type {MantineTitleProps} from "@AppBuilderLib/shared/mantine-props/title";
import {LineChart} from "@mantine/charts";
import {MantineThemeComponent, Paper, Title, useProps} from "@mantine/core";

/**
 * @docAttached
 * @category widget
 * @configPath themeOverrides.components.AppBuilderLineChartWidgetComponent.defaultProps
 * @displayName AppBuilderLineChartWidgetComponent
 */
export interface AppBuilderLineChartWidgetComponentStyleProps {
	widgetProps?: MantinePaperProps;
	titleProps?: MantineTitleProps;
	lineChartProps?: MantineLineChartProps;
}

const defaultStyleProps: Partial<AppBuilderLineChartWidgetComponentStyleProps> =
	{
		widgetProps: {},
		titleProps: {
			style: {marginBottom: "20px"},
		},
		lineChartProps: {
			h: 250,
		},
	};

type AppBuilderLineChartWidgetComponentThemePropsType =
	Partial<AppBuilderLineChartWidgetComponentStyleProps>;

export function AppBuilderLineChartWidgetComponentThemeProps(
	props: AppBuilderLineChartWidgetComponentThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

export default function AppBuilderLineChartWidgetComponent(
	props: IAppBuilderWidgetPropsLineChart &
		AppBuilderLineChartWidgetComponentThemePropsType,
) {
	const {name, style, plotSettings, data, ...rest} = props;

	const {widgetProps, titleProps, lineChartProps} = useProps(
		"AppBuilderLineChartWidgetComponent",
		defaultStyleProps,
		rest,
	);
	return (
		<Paper {...widgetProps}>
			<Title {...titleProps}>{name}</Title>
			<LineChart
				{...lineChartProps}
				withXAxis={plotSettings.xaxis}
				xAxisLabel={plotSettings.xlabel}
				withYAxis={plotSettings.yaxis}
				yAxisLabel={plotSettings.ylabel}
				gridAxis={plotSettings.grid}
				tickLine={plotSettings.grid}
				withDots={plotSettings.dots}
				withLegend={plotSettings.legend}
				data={convertChartData(data)}
				dataKey="key"
				series={data.series}
				curveType={style}
			/>
		</Paper>
	);
}
