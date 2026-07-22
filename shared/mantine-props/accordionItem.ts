import type {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineAccordionItemPropsSchema} from "./accordionItem.zod";

export {mantineAccordionItemPropsSchema};
export type MantineAccordionItemProps = z.infer<
	typeof mantineAccordionItemPropsSchema
>;
