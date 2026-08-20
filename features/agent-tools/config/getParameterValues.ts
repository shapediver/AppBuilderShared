import {z} from "@AppBuilderLib/shared/lib/zod";

export const getParameterValuesInputSchema = z.strictObject({
	names: z.array(z.string()).optional(),
});
