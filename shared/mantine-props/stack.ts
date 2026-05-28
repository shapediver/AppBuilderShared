import type {z} from "zod";
import {mantineStackPropsSchema} from "./stack.zod";

export {mantineStackPropsSchema};
export type MantineStackProps = z.infer<typeof mantineStackPropsSchema>;
