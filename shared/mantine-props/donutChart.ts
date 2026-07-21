import type {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineDonutChartPropsSchema} from "./donutChart.zod";

export {mantineDonutChartPropsSchema};
export type MantineDonutChartProps = z.infer<
	typeof mantineDonutChartPropsSchema
>;
