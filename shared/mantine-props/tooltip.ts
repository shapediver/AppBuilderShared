import type {z} from "zod";
import {mantineTooltipPropsSchema} from "./tooltip.zod";

export {mantineTooltipPropsSchema};
export type MantineTooltipProps = z.infer<typeof mantineTooltipPropsSchema>;
