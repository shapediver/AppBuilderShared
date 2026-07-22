import type {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineFlexPropsSchema} from "./flex.zod";

export {mantineFlexPropsSchema};
export type MantineFlexProps = z.infer<typeof mantineFlexPropsSchema>;
