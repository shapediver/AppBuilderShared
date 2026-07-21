import type {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineAccordionControlPropsSchema} from "./accordionControl.zod";

export {mantineAccordionControlPropsSchema};
export type MantineAccordionControlProps = z.infer<
	typeof mantineAccordionControlPropsSchema
>;
