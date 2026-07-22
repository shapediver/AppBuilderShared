import type {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineMenuDropdownPropsSchema} from "./menuDropdown.zod";

export {mantineMenuDropdownPropsSchema};
export type MantineMenuDropdownProps = z.infer<
	typeof mantineMenuDropdownPropsSchema
>;
