import type {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineAccordionPropsSchema} from "./accordion.zod";

export {mantineAccordionPropsSchema};
export type MantineAccordionProps = z.infer<typeof mantineAccordionPropsSchema>;
