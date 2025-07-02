import {
	convertChartData,
	IAppBuilderWidgetPropsAreaChart,
} from "@AppBuilderShared/types/shapediver/appbuildercharts";
import {AreaChart, AreaChartProps} from "@mantine/charts";
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
	areaChartProps?: Partial<AreaChartProps>;
};

const defaultStyleProps: Partial<StyleProps> = {
	widgetProps: {},
	titleProps: {
		style: {marginBottom: "20px"},
	},
	areaChartProps: {
		h: 250,
	},
};

type AppBuilderAreaChartWidgetComponentThemePropsType = Partial<StyleProps>;

export function AppBuilderAreaChartWidgetComponentThemeProps(
	props: AppBuilderAreaChartWidgetComponentThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

export default function AppBuilderAreaChartWidgetComponent(
	props: IAppBuilderWidgetPropsAreaChart &
		AppBuilderAreaChartWidgetComponentThemePropsType,
) {
	const {name, style, type, plotSettings, data, ...rest} = props;

	const {widgetProps, titleProps, areaChartProps} = useProps(
		"AppBuilderAreaChartWidgetComponent",
		defaultStyleProps,
		rest,
	);

	return (
		<Paper {...widgetProps}>
			<Title {...titleProps}>{name}</Title>
			<AreaChart
				{...areaChartProps}
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
				type={type}
			/>
		</Paper>
	);
}
