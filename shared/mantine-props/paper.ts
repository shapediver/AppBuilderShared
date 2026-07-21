import type {z} from "@AppBuilderLib/shared/lib/zod";
import {mantinePaperPropsSchema} from "./paper.zod";

export {mantinePaperPropsSchema};
export type MantinePaperProps = z.infer<typeof mantinePaperPropsSchema>;
