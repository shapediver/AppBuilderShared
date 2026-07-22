import type {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineCheckboxPropsSchema} from "./checkbox.zod";

export {mantineCheckboxPropsSchema};
export type MantineCheckboxProps = z.infer<typeof mantineCheckboxPropsSchema>;
