import {mantineGroupPropsSchema} from "@AppBuilderLib/shared/mantine-props/group.zod";
import {mantinePaperPropsSchema} from "@AppBuilderLib/shared/mantine-props/paper.zod";
import {mantineTitlePropsSchema} from "@AppBuilderLib/shared/mantine-props/title.zod";
import {z} from "zod";

export const AppBuilderAttributeVisualizationWidgetComponentThemeDefaultPropsSchema =
	z.strictObject({
		widgetProps: mantinePaperPropsSchema.optional(),
		widgetGroupProps: mantineGroupPropsSchema.optional(),
		titleProps: mantineTitlePropsSchema.optional(),
	});

export type AppBuilderAttributeVisualizationWidgetComponentThemeDefaultProps =
	z.infer<
		typeof AppBuilderAttributeVisualizationWidgetComponentThemeDefaultPropsSchema
	>;
