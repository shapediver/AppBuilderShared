import {
	importModelStateDataSchema,
	nameMessageSchema,
} from "@AppBuilderLib/features/model-state/config/importModelState.zod";
import {z} from "zod";

export const importModelStateInputSchema = importModelStateDataSchema;

export const importModelStateSuccessOutputSchema = z.object({
	success: z.literal(true),
	appliedParameterIds: z.array(z.string()),
	invalidParameters: z.array(nameMessageSchema).optional(),
});
