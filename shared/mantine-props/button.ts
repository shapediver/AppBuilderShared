import type {z} from "zod";
import {mantineButtonPropsSchema} from "./button.zod";

export {mantineButtonPropsSchema};
export type MantineButtonProps = z.infer<typeof mantineButtonPropsSchema>;
