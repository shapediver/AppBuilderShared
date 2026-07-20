import type {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineAlertPropsSchema} from "./alert.zod";

export {mantineAlertPropsSchema};
export type MantineAlertProps = z.infer<typeof mantineAlertPropsSchema>;
