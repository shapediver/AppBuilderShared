import {createModelStateDataSchema} from "@AppBuilderLib/features/model-state/config/createModelState.zod";
import {importModelStateDataSchema} from "@AppBuilderLib/features/model-state/config/importModelState.zod";
import z from "zod";

// Zod type definition for ICreateModelStateData
export const ICreateModelStateDataSchema = createModelStateDataSchema;

export const validateCreateModelStateData = (value: any) => {
	return ICreateModelStateDataSchema.safeParse(value);
};

// Zod type definition for IImportModelStateData
export const IImportModelStateDataSchema = importModelStateDataSchema;

export const validateImportModelStateData = (value: any) => {
	return IImportModelStateDataSchema.safeParse(value);
};

// Zod type definition for IUpdateParameterValuesData
export const IUpdateParameterValuesDataSchema = z.object({
	state: z.record(
		z.string(),
		z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
	),
	skipHistory: z.boolean().optional(),
	skipUrlUpdate: z.boolean().optional(),
});

export const validateUpdateParameterValuesData = (value: any) => {
	return IUpdateParameterValuesDataSchema.safeParse(value);
};
