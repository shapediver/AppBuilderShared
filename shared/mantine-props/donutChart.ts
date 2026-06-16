import type {z} from "zod";
import {mantineDonutChartPropsSchema} from "./donutChart.zod";

export {mantineDonutChartPropsSchema};
export type MantineDonutChartProps = z.infer<
	typeof mantineDonutChartPropsSchema
>;
