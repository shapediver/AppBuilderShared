import type {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineTextPropsSchema} from "./text.zod";

export {mantineTextPropsSchema};
export type MantineTextProps = z.infer<typeof mantineTextPropsSchema>;
