import type {z} from "zod";
import {mantineSizeTokenSchema, mantineSpacingSchema} from "./spacing.zod";

export {mantineSizeTokenSchema, mantineSpacingSchema};
export type MantineSizeToken = z.infer<typeof mantineSizeTokenSchema>;
export type MantineSpacing = z.infer<typeof mantineSpacingSchema>;
