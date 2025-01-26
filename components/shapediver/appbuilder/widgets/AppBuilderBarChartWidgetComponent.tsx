import React, { } from "react";
import { Paper, Title } from "@mantine/core";
import { convertChartData, IAppBuilderWidgetPropsBarChart } from "@AppBuilderShared/types/shapediver/appbuildercharts";
import { BarChart } from "@mantine/charts";

export default function AppBuilderBarChartWidgetComponent(props: IAppBuilderWidgetPropsBarChart) {

	const {name, type, plotSettings, data} = props;

	return (
		<Paper>
			<Title
				order={2} // TODO make this a style prop
				style={{marginBottom:"20px",}} // TODO make this a style prop
			>
				{name}
			</Title>
			<BarChart
				h={250} // TODO make this a style prop
				withXAxis= {plotSettings.xaxis}
				xAxisLabel= {plotSettings.xlabel}
				withYAxis= {plotSettings.yaxis}
				yAxisLabel= {plotSettings.ylabel}
				gridAxis= {plotSettings.grid}
				tickLine= {plotSettings.grid}
				withLegend= {plotSettings.legend}
				data={convertChartData(data)}
				dataKey="key"
				type={type}
				series={data.series}
			/>
		</Paper>
	);
}
