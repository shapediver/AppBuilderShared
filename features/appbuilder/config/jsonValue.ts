import {z} from "@AppBuilderLib/shared/lib/zod";

export type JsonValue =
	| string
	| number
	| boolean
	| null
	| JsonValue[]
	| {[key: string]: JsonValue};

export const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
	z.union([
		z.string(),
		z.number(),
		z.boolean(),
		z.null(),
		z.array(JsonValueSchema),
		z.record(z.string(), JsonValueSchema),
	]),
);
