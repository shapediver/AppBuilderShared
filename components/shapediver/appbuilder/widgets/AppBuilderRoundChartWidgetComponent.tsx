import {IAppBuilderWidgetPropsRoundChart} from "@AppBuilderShared/types/shapediver/appbuildercharts";
import {DonutChart, PieChart} from "@mantine/charts";
import {Badge, Paper, Title} from "@mantine/core";
import React from "react";

/**
 * Try to keep the string representation of the value to a
 * maximum number of characters.
 * Remove digits after the comma if the length gets longer.
 * @param value
 */
const valueFormatter = (value: number, maxChars: number) => {
	const stringValue = value.toString();
	if (stringValue.length > maxChars) {
		// split the string at the comma and only keep as many digits
		// after the comma as fit within the character limit
		const parts = stringValue.split(".");
		if (parts.length > 1 && parts[0].length <= maxChars - 2) {
			return value.toFixed(maxChars - parts[0].length - 1);
		}

		return value.toFixed(0);
	}

	return stringValue;
};

export default function AppBuilderRoundChartWidgetComponent(
	props: IAppBuilderWidgetPropsRoundChart,
) {
	const {name, style, labels = true, legend, data} = props;

	return (
		<Paper>
			<Title order={2}>{name}</Title>
			{style == "pie" ? (
				<PieChart
					{...(labels ? {withLabels: true} : {})}
					labelsPosition="inside"
					labelsType="value"
					withTooltip={!labels}
					tooltipDataSource="all"
					style={{height: "250px"}} // TODO make this a style prop
					data={data}
					valueFormatter={(v) => valueFormatter(v, labels ? 6 : 8)}
				/>
			) : (
				<DonutChart
					{...(labels ? {withLabels: true} : {})}
					style={{height: "250px"}} // TODO make this a style prop
					withTooltip={!labels}
					data={data}
					/**
					 * Note: there seems to be a bug for the donut chart,
					 * it doesn't apply the value formatter to labels. We
					 * could apply the value formatter to all data points to
					 * work around this, but let's wait for a fix first.
					 */
					valueFormatter={(v) => valueFormatter(v, labels ? 6 : 8)}
				/>
			)}
			{(legend ?? true)
				? data.map((item, index) => (
						<Badge
							key={index}
							style={{marginRight: "10px"}} // TODO make this a style prop
							color={item.color}
						>
							{item.name}
						</Badge>
					))
				: undefined}
		</Paper>
	);
}
