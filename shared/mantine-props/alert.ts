import type {z} from "zod";
import {mantineAlertPropsSchema} from "./alert.zod";

export {mantineAlertPropsSchema};
export type MantineAlertProps = z.infer<typeof mantineAlertPropsSchema>;
