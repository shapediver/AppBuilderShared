import type {z} from "zod";
import {mantineMenuDropdownPropsSchema} from "./menuDropdown.zod";

export {mantineMenuDropdownPropsSchema};
export type MantineMenuDropdownProps = z.infer<
	typeof mantineMenuDropdownPropsSchema
>;
