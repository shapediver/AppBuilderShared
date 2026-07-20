import type {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineButtonPropsSchema} from "./button.zod";

export {mantineButtonPropsSchema};
export type MantineButtonProps = z.infer<typeof mantineButtonPropsSchema>;
