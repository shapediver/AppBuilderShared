import type {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineTitlePropsSchema} from "./title.zod";

export {mantineTitlePropsSchema};
export type MantineTitleProps = z.infer<typeof mantineTitlePropsSchema>;
