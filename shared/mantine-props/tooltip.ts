import type {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineTooltipPropsSchema} from "./tooltip.zod";

export {mantineTooltipPropsSchema};
export type MantineTooltipProps = z.infer<typeof mantineTooltipPropsSchema>;
