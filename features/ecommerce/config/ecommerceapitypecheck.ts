import {IAppBuilderImageRefSchema} from "@AppBuilderShared/features/appbuilder/config/appbuildertypecheck";
import z from "zod";

// Zod type definition for ICreateModelStateData
export const ICreateModelStateDataSchema = z.object({
	parameterNamesToInclude: z.array(z.string()).optional(),
	parameterNamesToExclude: z.array(z.string()).optional(),
	includeImage: z.boolean().optional(),
	image: IAppBuilderImageRefSchema.optional(),
	data: z.record(z.string(), z.any()).optional(),
	includeGltf: z.boolean().optional(),
});

export const validateCreateModelStateData = (value: any) => {
	return ICreateModelStateDataSchema.safeParse(value);
};

// Zod type definition for IImportModelStateData
export const IImportModelStateDataSchema = z.object({
	modelStateId: z.string(),
});

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
