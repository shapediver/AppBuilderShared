import {z} from "@AppBuilderLib/shared/lib/zod";

/** Data output name previously read by the removed `get_metric` tool. */
export const AGENT_METRIC_OUTPUT_NAME = "AgentMetric";

export const getOutputInputSchema = z.strictObject({
	output: z.string().min(1),
	namespace: z.string().optional(),
});

export type GetOutputInput = z.infer<typeof getOutputInputSchema>;

/** Same fields as e-commerce `IGetOutputReply`. */
export type GetOutputOutput = {
	found: boolean;
	content?: unknown;
	message?: string;
};
