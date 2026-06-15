import type {z} from "zod";
import {mantineAreaChartPropsSchema} from "./areaChart.zod";

export {mantineAreaChartPropsSchema};
export type MantineAreaChartProps = z.infer<typeof mantineAreaChartPropsSchema>;
