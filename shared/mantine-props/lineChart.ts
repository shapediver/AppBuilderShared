import type {z} from "zod";
import {mantineLineChartPropsSchema} from "./lineChart.zod";

export {mantineLineChartPropsSchema};
export type MantineLineChartProps = z.infer<typeof mantineLineChartPropsSchema>;
