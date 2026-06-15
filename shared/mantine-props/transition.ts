import type {z} from "zod";
import {mantineTransitionPropsSchema} from "./transition.zod";

export {mantineTransitionPropsSchema};
export type MantineTransitionProps = z.infer<
	typeof mantineTransitionPropsSchema
>;
