import type {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineAccordionPanelPropsSchema} from "./accordionPanel.zod";

export {mantineAccordionPanelPropsSchema};
export type MantineAccordionPanelProps = z.infer<
	typeof mantineAccordionPanelPropsSchema
>;
