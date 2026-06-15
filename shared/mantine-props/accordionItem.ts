import type {z} from "zod";
import {mantineAccordionItemPropsSchema} from "./accordionItem.zod";

export {mantineAccordionItemPropsSchema};
export type MantineAccordionItemProps = z.infer<
	typeof mantineAccordionItemPropsSchema
>;
