import type {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineDividerPropsSchema} from "./divider.zod";

export {mantineDividerPropsSchema};
export type MantineDividerProps = z.infer<typeof mantineDividerPropsSchema>;
