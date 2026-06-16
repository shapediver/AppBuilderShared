import {mantineBadgePropsSchema} from "@AppBuilderLib/shared/mantine-props/badge.zod";
import {mantineDonutChartPropsSchema} from "@AppBuilderLib/shared/mantine-props/donutChart.zod";
import {mantinePaperPropsSchema} from "@AppBuilderLib/shared/mantine-props/paper.zod";
import {mantinePieChartPropsSchema} from "@AppBuilderLib/shared/mantine-props/pieChart.zod";
import {mantineTitlePropsSchema} from "@AppBuilderLib/shared/mantine-props/title.zod";
import {z} from "zod";

export const AppBuilderRoundChartWidgetComponentThemeDefaultPropsSchema =
	z.strictObject({
		widgetProps: mantinePaperPropsSchema.optional(),
		titleProps: mantineTitlePropsSchema.optional(),
		pieChartProps: mantinePieChartPropsSchema.optional(),
		donutChartProps: mantineDonutChartPropsSchema.optional(),
		badgeProps: mantineBadgePropsSchema.optional(),
	});

export type AppBuilderRoundChartWidgetComponentThemeDefaultProps = z.infer<
	typeof AppBuilderRoundChartWidgetComponentThemeDefaultPropsSchema
>;
