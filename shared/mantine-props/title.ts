import type {z} from "zod";
import {mantineTitlePropsSchema} from "./title.zod";

export {mantineTitlePropsSchema};
export type MantineTitleProps = z.infer<typeof mantineTitlePropsSchema>;
