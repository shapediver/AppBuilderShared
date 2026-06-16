import type {z} from "zod";
import {mantineDividerPropsSchema} from "./divider.zod";

export {mantineDividerPropsSchema};
export type MantineDividerProps = z.infer<typeof mantineDividerPropsSchema>;
