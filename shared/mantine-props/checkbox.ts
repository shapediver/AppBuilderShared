import type {z} from "zod";
import {mantineCheckboxPropsSchema} from "./checkbox.zod";

export {mantineCheckboxPropsSchema};
export type MantineCheckboxProps = z.infer<typeof mantineCheckboxPropsSchema>;
