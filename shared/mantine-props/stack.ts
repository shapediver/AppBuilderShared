import type {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineStackPropsSchema} from "./stack.zod";

export {mantineStackPropsSchema};
export type MantineStackProps = z.infer<typeof mantineStackPropsSchema>;
