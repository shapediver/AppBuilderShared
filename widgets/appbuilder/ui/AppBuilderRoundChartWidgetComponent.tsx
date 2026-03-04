import {IAppBuilderWidgetPropsRoundChart} from "@AppBuilderShared/types/shapediver/appbuildercharts";
import {
	DonutChart,
	DonutChartProps,
	PieChart,
	PieChartProps,
} from "@mantine/charts";
import {
	Badge,
	BadgeProps,
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
	pieChartProps?: Partial<PieChartProps>;
	donutChartProps?: Partial<DonutChartProps>;
	badgeProps?: Partial<BadgeProps>;
};

const defaultStyleProps: Partial<StyleProps> = {
	widgetProps: {},
	titleProps: {},
	pieChartProps: {
		h: 250,
	},
	donutChartProps: {
		h: 250,
	},
	badgeProps: {
		style: {marginRight: "10px"},
	},
};

type AppBuilderRoundChartWidgetComponentThemePropsType = Partial<StyleProps>;

export function AppBuilderRoundChartWidgetComponentThemeProps(
	props: AppBuilderRoundChartWidgetComponentThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

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
	props: IAppBuilderWidgetPropsRoundChart &
		AppBuilderRoundChartWidgetComponentThemePropsType,
) {
	const {name, style, labels = true, legend, data, ...rest} = props;

	const {
		widgetProps,
		titleProps,
		pieChartProps,
		donutChartProps,
		badgeProps,
	} = useProps(
		"AppBuilderRoundChartWidgetComponent",
		defaultStyleProps,
		rest,
	);

	return (
		<Paper {...widgetProps}>
			<Title {...titleProps}>{name}</Title>
			{style == "pie" ? (
				<PieChart
					{...pieChartProps}
					{...(labels ? {withLabels: true} : {})}
					labelsPosition="inside"
					labelsType="value"
					withTooltip={!labels}
					tooltipDataSource="all"
					data={data}
					valueFormatter={(v) => valueFormatter(v, labels ? 6 : 8)}
				/>
			) : (
				<DonutChart
					{...donutChartProps}
					{...(labels ? {withLabels: true} : {})}
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
						<Badge {...badgeProps} key={index} color={item.color}>
							{item.name}
						</Badge>
					))
				: undefined}
		</Paper>
	);
}
