import type {z} from "zod";
import {mantineBarChartPropsSchema} from "./barChart.zod";

export {mantineBarChartPropsSchema};
export type MantineBarChartProps = z.infer<typeof mantineBarChartPropsSchema>;
