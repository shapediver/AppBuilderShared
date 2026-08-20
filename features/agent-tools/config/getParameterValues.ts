import {z} from "zod";

export const getParameterValuesInputSchema = z.strictObject({
	names: z.array(z.string()).optional(),
});
