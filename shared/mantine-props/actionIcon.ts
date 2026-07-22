import type {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineActionIconPropsSchema} from "./actionIcon.zod";

export {mantineActionIconPropsSchema};
export type MantineActionIconProps = z.infer<
	typeof mantineActionIconPropsSchema
>;
