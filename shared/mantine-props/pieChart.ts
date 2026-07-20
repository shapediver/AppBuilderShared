import type {z} from "@AppBuilderLib/shared/lib/zod";
import {mantinePieChartPropsSchema} from "./pieChart.zod";

export {mantinePieChartPropsSchema};
export type MantinePieChartProps = z.infer<typeof mantinePieChartPropsSchema>;
