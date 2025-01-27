import React from "react";
import {Paper, Title} from "@mantine/core";
import {
	convertChartData,
	IAppBuilderWidgetPropsAreaChart,
} from "@AppBuilderShared/types/shapediver/appbuildercharts";
import {AreaChart} from "@mantine/charts";

export default function AppBuilderAreaChartWidgetComponent(
	props: IAppBuilderWidgetPropsAreaChart,
) {
	const {name, style, type, plotSettings, data} = props;

	return (
		<Paper>
			<Title
				order={2} // TODO make this a style prop
				style={{marginBottom: "20px"}} // TODO make this a style prop
			>
				{name}
			</Title>
			<AreaChart
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
				type={type}
			/>
		</Paper>
	);
}
