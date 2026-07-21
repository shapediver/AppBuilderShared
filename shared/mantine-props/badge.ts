import type {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineBadgePropsSchema} from "./badge.zod";

export {mantineBadgePropsSchema};
export type MantineBadgeProps = z.infer<typeof mantineBadgePropsSchema>;
