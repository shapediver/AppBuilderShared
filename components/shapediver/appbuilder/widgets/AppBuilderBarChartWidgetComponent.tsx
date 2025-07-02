import {
	convertChartData,
	IAppBuilderWidgetPropsBarChart,
} from "@AppBuilderShared/types/shapediver/appbuildercharts";
import {BarChart, BarChartProps} from "@mantine/charts";
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
	barChartProps?: Partial<BarChartProps>;
};

const defaultStyleProps: Partial<StyleProps> = {
	widgetProps: {},
	titleProps: {
		style: {marginBottom: "20px"},
	},
	barChartProps: {
		h: 250,
	},
};

type AppBuilderBarChartWidgetComponentThemePropsType = Partial<StyleProps>;

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
