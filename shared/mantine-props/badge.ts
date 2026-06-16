import type {z} from "zod";
import {mantineBadgePropsSchema} from "./badge.zod";

export {mantineBadgePropsSchema};
export type MantineBadgeProps = z.infer<typeof mantineBadgePropsSchema>;
