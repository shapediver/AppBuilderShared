import type {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineGroupPropsSchema} from "./group.zod";

export {mantineGroupPropsSchema};
export type MantineGroupProps = z.infer<typeof mantineGroupPropsSchema>;
