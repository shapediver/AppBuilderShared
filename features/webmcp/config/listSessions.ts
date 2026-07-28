import {z} from "@AppBuilderLib/shared/lib/zod";

export const listSessionsInputSchema = z.strictObject({});

export const listSessionsOutputSchema = z.object({
	content: z.array(
		z.object({
			type: z.literal("text"),
			text: z.string(),
		}),
	),
	structuredContent: z.object({
		sessions: z.array(
			z.object({
				sessionId: z.string(),
			}),
		),
	}),
	isError: z.literal(true).optional(),
});

export type ListSessionsOutput = z.infer<typeof listSessionsOutputSchema>;
