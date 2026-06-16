import type {z} from "zod";
import {mantineAccordionControlPropsSchema} from "./accordionControl.zod";

export {mantineAccordionControlPropsSchema};
export type MantineAccordionControlProps = z.infer<
	typeof mantineAccordionControlPropsSchema
>;
