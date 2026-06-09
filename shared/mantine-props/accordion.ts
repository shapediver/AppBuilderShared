import type {z} from "zod";
import {mantineAccordionPropsSchema} from "./accordion.zod";

export {mantineAccordionPropsSchema};
export type MantineAccordionProps = z.infer<typeof mantineAccordionPropsSchema>;
