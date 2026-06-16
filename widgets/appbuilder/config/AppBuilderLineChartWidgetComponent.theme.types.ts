import {mantineLineChartPropsSchema} from "@AppBuilderLib/shared/mantine-props/lineChart.zod";
import {mantinePaperPropsSchema} from "@AppBuilderLib/shared/mantine-props/paper.zod";
import {mantineTitlePropsSchema} from "@AppBuilderLib/shared/mantine-props/title.zod";
import {z} from "zod";

export const AppBuilderLineChartWidgetComponentThemeDefaultPropsSchema =
	z.strictObject({
		widgetProps: mantinePaperPropsSchema.optional(),
		titleProps: mantineTitlePropsSchema.optional(),
		lineChartProps: mantineLineChartPropsSchema.optional(),
	});

export type AppBuilderLineChartWidgetComponentThemeDefaultProps = z.infer<
	typeof AppBuilderLineChartWidgetComponentThemeDefaultPropsSchema
>;
