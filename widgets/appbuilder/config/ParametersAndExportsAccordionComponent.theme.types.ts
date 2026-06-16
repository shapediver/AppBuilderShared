import {mantineAccordionPropsSchema} from "@AppBuilderLib/shared/mantine-props/accordion.zod";
import {mantineAccordionControlPropsSchema} from "@AppBuilderLib/shared/mantine-props/accordionControl.zod";
import {mantineAccordionItemPropsSchema} from "@AppBuilderLib/shared/mantine-props/accordionItem.zod";
import {mantineAccordionPanelPropsSchema} from "@AppBuilderLib/shared/mantine-props/accordionPanel.zod";
import {mantinePaperPropsSchema} from "@AppBuilderLib/shared/mantine-props/paper.zod";
import {mantineStackPropsSchema} from "@AppBuilderLib/shared/mantine-props/stack.zod";
import {z} from "zod";

export const ParametersAndExportsAccordionComponentThemeDefaultPropsSchema = z.strictObject({
	defaultGroupName: z.string().optional(),
	avoidSingleComponentGroups: z.boolean().optional(),
	mergeAccordions: z.boolean().optional(),
	pbSlider: z.string().optional(),
	identifyGroupsById: z.boolean().optional(),
	accordionPaperProps: mantinePaperPropsSchema.optional(),
	elementPaperProps: mantinePaperPropsSchema.optional(),
	accordionProps: mantineAccordionPropsSchema.optional(),
	accordionItemProps: mantineAccordionItemPropsSchema.optional(),
	accordionControlProps: mantineAccordionControlPropsSchema.optional(),
	accordionPanelProps: mantineAccordionPanelPropsSchema.optional(),
	wrapperStackProps: mantineStackPropsSchema.optional(),
	elementStackProps: mantineStackPropsSchema.optional(),
	panelStackProps: mantineStackPropsSchema.optional(),
});

export type ParametersAndExportsAccordionComponentThemeDefaultProps = z.infer<
	typeof ParametersAndExportsAccordionComponentThemeDefaultPropsSchema
>;
