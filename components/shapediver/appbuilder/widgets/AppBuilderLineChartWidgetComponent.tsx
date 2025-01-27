import React from "react";
import {Paper, Title} from "@mantine/core";
import {
	convertChartData,
	IAppBuilderWidgetPropsLineChart,
} from "@AppBuilderShared/types/shapediver/appbuildercharts";
import {LineChart} from "@mantine/charts";

export default function AppBuilderLineChartWidgetComponent(
	props: IAppBuilderWidgetPropsLineChart,
) {
	const {name, style, plotSettings, data} = props;

	return (
		<Paper>
			<Title
				order={2} // TODO make this a style prop
				style={{marginBottom: "20px"}} // TODO make this a style prop
			>
				{name}
			</Title>
			<LineChart
				h={250} // TODO make this a style prop
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
