import {z} from "zod";

export const AGENT_METRIC_OUTPUT_NAME = "AgentMetric";

export const getMetricInputSchema = z.strictObject({});

export type GetMetricInput = z.infer<typeof getMetricInputSchema>;
export type GetMetricOutput = {
	found: boolean;
	value?: unknown;
	message?: string;
};
