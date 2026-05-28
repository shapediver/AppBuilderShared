import type {z} from "zod";
import {mantineBoxPropsSchema} from "./box.zod";

export {mantineBoxPropsSchema};
export type MantineBoxProps = z.infer<typeof mantineBoxPropsSchema>;
