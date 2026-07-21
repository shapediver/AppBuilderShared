import type {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineAreaChartPropsSchema} from "./areaChart.zod";

export {mantineAreaChartPropsSchema};
export type MantineAreaChartProps = z.infer<typeof mantineAreaChartPropsSchema>;
