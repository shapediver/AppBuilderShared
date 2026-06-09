import type {z} from "zod";
import {mantineGroupPropsSchema} from "./group.zod";

export {mantineGroupPropsSchema};
export type MantineGroupProps = z.infer<typeof mantineGroupPropsSchema>;
