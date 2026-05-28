import type {z} from "zod";
import {mantineSpacingSchema} from "./spacing.zod";

export {mantineSpacingSchema};
export type MantineSpacing = z.infer<typeof mantineSpacingSchema>;
