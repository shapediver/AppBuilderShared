import {mantineAreaChartPropsSchema} from "@AppBuilderLib/shared/mantine-props/areaChart.zod";
import {mantinePaperPropsSchema} from "@AppBuilderLib/shared/mantine-props/paper.zod";
import {mantineTitlePropsSchema} from "@AppBuilderLib/shared/mantine-props/title.zod";
import {z} from "zod";

export const AppBuilderAreaChartWidgetComponentThemeDefaultPropsSchema =
	z.strictObject({
		widgetProps: mantinePaperPropsSchema.optional(),
		titleProps: mantineTitlePropsSchema.optional(),
		areaChartProps: mantineAreaChartPropsSchema.optional(),
	});

export type AppBuilderAreaChartWidgetComponentThemeDefaultProps = z.infer<
	typeof AppBuilderAreaChartWidgetComponentThemeDefaultPropsSchema
>;
