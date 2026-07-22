import type {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineMenuPropsSchema} from "./menu.zod";

export {mantineMenuPropsSchema};
export type MantineMenuProps = z.infer<typeof mantineMenuPropsSchema>;
