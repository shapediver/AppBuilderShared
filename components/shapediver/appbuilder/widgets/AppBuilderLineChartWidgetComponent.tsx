import {
	convertChartData,
	IAppBuilderWidgetPropsLineChart,
} from "@AppBuilderShared/types/shapediver/appbuildercharts";
import {LineChart, LineChartProps} from "@mantine/charts";
import {
	MantineThemeComponent,
	Paper,
	PaperProps,
	Title,
	TitleProps,
	useProps,
} from "@mantine/core";
import React from "react";

type StyleProps = {
	widgetProps?: Partial<PaperProps>;
	titleProps?: Partial<TitleProps>;
	lineChartProps?: Partial<LineChartProps>;
};

const defaultStyleProps: Partial<StyleProps> = {
	widgetProps: {},
	titleProps: {
		style: {marginBottom: "20px"},
	},
	lineChartProps: {
		h: 250,
	},
};

type AppBuilderLineChartWidgetComponentThemePropsType = Partial<StyleProps>;

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
