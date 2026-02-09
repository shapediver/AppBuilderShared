import z from "zod";

// Zod type definition for IUpdateParameterValuesData
export const IUpdateParameterValuesDataSchema = z.object({
	state: z.record(z.record(z.any())),
	skipHistory: z.boolean().optional(),
	skipUrlUpdate: z.boolean().optional(),
});

export const validateUpdateParameterValuesData = (value: any) => {
	return IUpdateParameterValuesDataSchema.safeParse(value);
};
