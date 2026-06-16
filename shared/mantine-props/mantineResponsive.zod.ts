import {z} from "zod";

const mantineBreakpointObjectShape = <T extends z.ZodTypeAny>(valueSchema: T) =>
	({
		base: valueSchema.optional(),
		xs: valueSchema.optional(),
		sm: valueSchema.optional(),
		md: valueSchema.optional(),
		lg: valueSchema.optional(),
		xl: valueSchema.optional(),
	}) as const;

/** Build `T | { base?, xs?, …, xl? }` Zod schema (matches `MantineResponsive<T>`). */
export function mantineResponsiveSchema<T extends z.ZodTypeAny>(
	valueSchema: T,
	options?: {catchall?: boolean},
) {
	const objectSchema = z.object(mantineBreakpointObjectShape(valueSchema));
	const responsiveObject = options?.catchall
		? objectSchema.catchall(valueSchema.optional())
		: objectSchema;

	return z.union([valueSchema, responsiveObject]);
}
