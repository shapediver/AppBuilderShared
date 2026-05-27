import {z} from "zod";

export type JsonValue =
	| string
	| number
	| boolean
	| null
	| JsonValue[]
	| {[key: string]: JsonValue};

export const JsonValueSchema: z.ZodType<JsonValue> = z.union([
	z.string(),
	z.number(),
	z.boolean(),
	z.null(),
	z.lazy(() => z.array(JsonValueSchema)),
	z.lazy(() => z.record(z.string(), JsonValueSchema)),
]);
