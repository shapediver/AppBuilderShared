import type {z} from "zod";
import {mantineActionIconPropsSchema} from "./actionIcon.zod";

export {mantineActionIconPropsSchema};
export type MantineActionIconProps = z.infer<
	typeof mantineActionIconPropsSchema
>;
