import type {z} from "zod";
import {mantinePieChartPropsSchema} from "./pieChart.zod";

export {mantinePieChartPropsSchema};
export type MantinePieChartProps = z.infer<typeof mantinePieChartPropsSchema>;
