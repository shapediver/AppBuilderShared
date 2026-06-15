import {mantineAccordionPropsSchema} from "@AppBuilderLib/shared/mantine-props/accordion.zod";
import {mantineAccordionControlPropsSchema} from "@AppBuilderLib/shared/mantine-props/accordionControl.zod";
import {mantineAccordionItemPropsSchema} from "@AppBuilderLib/shared/mantine-props/accordionItem.zod";
import {mantineAccordionPanelPropsSchema} from "@AppBuilderLib/shared/mantine-props/accordionPanel.zod";
import {mantinePaperPropsSchema} from "@AppBuilderLib/shared/mantine-props/paper.zod";
import {mantineStackPropsSchema} from "@AppBuilderLib/shared/mantine-props/stack.zod";
import {z} from "zod";

/** Theme `defaultProps` for `useProps("OutputStargateComponent", …)`. */
export const OutputStargateComponentThemeDefaultPropsSchema = z.strictObject({
	stackProps: mantineStackPropsSchema.optional(),
	paperProps: mantinePaperPropsSchema.optional(),
	accordionProps: mantineAccordionPropsSchema.optional(),
	accordionItemProps: mantineAccordionItemPropsSchema.optional(),
	accordionControlProps: mantineAccordionControlPropsSchema.optional(),
	accordionPanelProps: mantineAccordionPanelPropsSchema.optional(),
});

export type OutputStargateComponentThemeDefaultProps = z.infer<
	typeof OutputStargateComponentThemeDefaultPropsSchema
>;
