import type {z} from "zod";
import {mantineSelectPropsSchema} from "./select.zod";

export {mantineSelectPropsSchema};
export type MantineSelectProps = z.infer<typeof mantineSelectPropsSchema>;
