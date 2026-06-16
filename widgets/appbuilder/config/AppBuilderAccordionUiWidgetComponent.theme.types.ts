import {mantineAccordionPropsSchema} from "@AppBuilderLib/shared/mantine-props/accordion.zod";
import {mantineAccordionControlPropsSchema} from "@AppBuilderLib/shared/mantine-props/accordionControl.zod";
import {mantineAccordionItemPropsSchema} from "@AppBuilderLib/shared/mantine-props/accordionItem.zod";
import {mantineAccordionPanelPropsSchema} from "@AppBuilderLib/shared/mantine-props/accordionPanel.zod";
import {mantinePaperPropsSchema} from "@AppBuilderLib/shared/mantine-props/paper.zod";
import {mantineStackPropsSchema} from "@AppBuilderLib/shared/mantine-props/stack.zod";
import {z} from "zod";

export const AppBuilderAccordionUiWidgetComponentThemeDefaultPropsSchema = z.strictObject({
	accordionProps: mantineAccordionPropsSchema.optional(),
	accordionPaperProps: mantinePaperPropsSchema.optional(),
	accordionItemProps: mantineAccordionItemPropsSchema.optional(),
	accordionControlProps: mantineAccordionControlPropsSchema.optional(),
	accordionPanelProps: mantineAccordionPanelPropsSchema.optional(),
	stackProps: mantineStackPropsSchema.optional(),
});

export type AppBuilderAccordionUiWidgetComponentThemeDefaultProps = z.infer<
	typeof AppBuilderAccordionUiWidgetComponentThemeDefaultPropsSchema
>;
