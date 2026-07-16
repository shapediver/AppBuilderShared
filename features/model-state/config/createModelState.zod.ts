import {z} from "zod";

export const createModelStateImageRefSchema = z.strictObject({
	export: z
		.strictObject({
			name: z.string(),
			sessionId: z.string().optional(),
		})
		.optional(),
	href: z.string().optional(),
});

export const createModelStateCoreSchema = z.strictObject({
	parameterNamesToInclude: z.array(z.string()).optional(),
	parameterNamesToExclude: z.array(z.string()).optional(),
	includeImage: z.boolean().optional(),
	includeGltf: z.boolean().optional(),
});

export const createModelStateDataSchema = createModelStateCoreSchema.extend({
	image: createModelStateImageRefSchema.optional(),
	data: z.record(z.string(), z.any()).optional(),
});
