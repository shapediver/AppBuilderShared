import type {z} from "zod";
import {mantineAccordionPanelPropsSchema} from "./accordionPanel.zod";

export {mantineAccordionPanelPropsSchema};
export type MantineAccordionPanelProps = z.infer<
	typeof mantineAccordionPanelPropsSchema
>;
