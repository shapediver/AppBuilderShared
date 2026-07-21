import type {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineSelectPropsSchema} from "./select.zod";

export {mantineSelectPropsSchema};
export type MantineSelectProps = z.infer<typeof mantineSelectPropsSchema>;
