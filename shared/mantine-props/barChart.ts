import type {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineBarChartPropsSchema} from "./barChart.zod";

export {mantineBarChartPropsSchema};
export type MantineBarChartProps = z.infer<typeof mantineBarChartPropsSchema>;
