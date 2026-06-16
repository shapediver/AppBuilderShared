import type {z} from "zod";
import {mantineFlexPropsSchema} from "./flex.zod";

export {mantineFlexPropsSchema};
export type MantineFlexProps = z.infer<typeof mantineFlexPropsSchema>;
