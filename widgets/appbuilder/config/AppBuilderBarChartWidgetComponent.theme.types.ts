import {mantineBarChartPropsSchema} from "@AppBuilderLib/shared/mantine-props/barChart.zod";
import {mantinePaperPropsSchema} from "@AppBuilderLib/shared/mantine-props/paper.zod";
import {mantineTitlePropsSchema} from "@AppBuilderLib/shared/mantine-props/title.zod";
import {z} from "zod";

export const AppBuilderBarChartWidgetComponentThemeDefaultPropsSchema =
	z.strictObject({
		widgetProps: mantinePaperPropsSchema.optional(),
		titleProps: mantineTitlePropsSchema.optional(),
		barChartProps: mantineBarChartPropsSchema.optional(),
	});

export type AppBuilderBarChartWidgetComponentThemeDefaultProps = z.infer<
	typeof AppBuilderBarChartWidgetComponentThemeDefaultPropsSchema
>;
