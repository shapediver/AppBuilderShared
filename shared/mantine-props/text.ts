import type {z} from "zod";
import {mantineTextPropsSchema} from "./text.zod";

export {mantineTextPropsSchema};
export type MantineTextProps = z.infer<typeof mantineTextPropsSchema>;
