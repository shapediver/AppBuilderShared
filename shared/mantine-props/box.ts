import type {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineBoxPropsSchema} from "./box.zod";

export {mantineBoxPropsSchema};
export type MantineBoxProps = z.infer<typeof mantineBoxPropsSchema>;
