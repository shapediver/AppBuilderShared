import type {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineTransitionPropsSchema} from "./transition.zod";

export {mantineTransitionPropsSchema};
export type MantineTransitionProps = z.infer<
	typeof mantineTransitionPropsSchema
>;
