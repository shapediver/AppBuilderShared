import type {z} from "zod";
import {mantineMenuPropsSchema} from "./menu.zod";

export {mantineMenuPropsSchema};
export type MantineMenuProps = z.infer<typeof mantineMenuPropsSchema>;
