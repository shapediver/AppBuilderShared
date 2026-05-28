import {z} from "zod";

export const JsonValueSchema: z.ZodTypeAny = z.lazy(() =>
	z.union([
		z.string(),
		z.number(),
		z.boolean(),
		z.null(),
		z.array(JsonValueSchema),
		z.record(z.string(), JsonValueSchema),
	]),
);

export type JsonValue = z.infer<typeof JsonValueSchema>;
