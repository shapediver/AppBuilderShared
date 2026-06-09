import type {z} from "zod";
import {mantinePaperPropsSchema} from "./paper.zod";

export {mantinePaperPropsSchema};
export type MantinePaperProps = z.infer<typeof mantinePaperPropsSchema>;
