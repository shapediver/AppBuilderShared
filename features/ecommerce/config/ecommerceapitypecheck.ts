import {viewportScreenshotPropsSchema} from "@AppBuilderLib/entities/viewport/config/viewportScreenshotProps.zod";
import {JsonValueSchema} from "@AppBuilderLib/features/appbuilder/config/jsonValue";
import {
	createModelStateCoreSchema,
	createModelStateDataSchema,
	createModelStateImageRefSchema,
} from "@AppBuilderLib/features/model-state/config/createModelState.zod";
import {importModelStateDataSchema} from "@AppBuilderLib/features/model-state/config/importModelState.zod";
import {z} from "@AppBuilderLib/shared/lib/zod";
import {CAMERA_TYPE} from "@shapediver/viewer.shared.types";

/**
 * Trigger-action prop schemas. Same rules as App Builder
 * `IAppBuilderActionProps*Schema` in appbuildertypecheck.ts.
 * Do not import that module — it pulls UI into the ecommerce client.
 */
const actionPropsCommonSchema = z.strictObject({
	id: z.string().optional(),
	label: z.string().optional(),
	icon: z.string().optional(),
	tooltip: z.string().optional(),
});

const createModelStateActionPropsSchema = createModelStateCoreSchema.extend({
	image: createModelStateImageRefSchema.optional(),
	successMessage: z.string().optional(),
	errorMessage: z.string().optional(),
});

const addToCartActionPropsSchema = z
	.strictObject({
		productId: z.string().optional(),
		quantity: z.number().optional(),
		price: z.number().optional(),
		description: z.string().optional(),
		title: z.string().optional(),
	})
	.extend(createModelStateActionPropsSchema.shape);

const parameterValueSourceSchema: z.ZodType<unknown> = z.discriminatedUnion(
	"type",
	[
		z.strictObject({
			type: z.literal("dataOutput"),
			props: z.strictObject({
				sessionId: z.string().optional(),
				name: z.string(),
			}),
		}),
		z.strictObject({
			type: z.literal("export"),
			props: z.strictObject({
				sessionId: z.string().optional(),
				name: z.string(),
				parameterValues: z
					.record(
						z.string(),
						z.union([
							z.string(),
							z.number(),
							z.boolean(),
							z.lazy(() => parameterValueSourceSchema),
						]),
					)
					.optional(),
			}),
		}),
		z.strictObject({
			type: z.literal("modelState"),
			props: createModelStateActionPropsSchema.extend({
				updateUrl: z.boolean().optional(),
			}),
		}),
		z.strictObject({
			type: z.literal("screenshot"),
			props: viewportScreenshotPropsSchema,
		}),
		z.strictObject({
			type: z.literal("sdtf"),
			props: z.strictObject({
				sessionId: z.string().optional(),
				name: z.string(),
				chunk: z
					.strictObject({
						id: z.string().optional(),
						name: z.string().optional(),
					})
					.optional(),
			}),
		}),
		z.strictObject({
			type: z.literal("agentTool"),
			props: z.strictObject({
				jsonPath: z.string(),
			}),
		}),
	],
);

const setParameterValueActionPropsSchema = z.strictObject({
	parameter: z.strictObject({
		name: z.string(),
		sessionId: z.string().optional(),
	}),
	value: z.string().optional(),
	source: parameterValueSourceSchema.optional(),
});

const setParameterValuesActionPropsSchema = z.strictObject({
	parameterValues: z.array(setParameterValueActionPropsSchema),
	message: z.string().optional(),
});

const emptyActionPropsSchema = z.strictObject({});

const cameraCommonSchema = z.strictObject({
	camera: z
		.union([
			z.looseObject({
				id: z.string().optional(),
				name: z.string().optional(),
			}),
			z.looseObject({
				type: z.enum(CAMERA_TYPE),
			}),
		])
		.optional(),
	options: z.record(z.string(), JsonValueSchema).optional(),
});

const cameraActionPropsSchema = z.discriminatedUnion("type", [
	z
		.strictObject({
			type: z.literal("animate"),
			viewportId: z.string().optional(),
			props: z
				.strictObject({
					path: z.array(
						z.strictObject({
							position: z.array(z.number()).length(3),
							target: z.array(z.number()).length(3),
						}),
					),
					startFromCurrent: z.boolean().optional(),
				})
				.extend(cameraCommonSchema.shape),
		})
		.extend(actionPropsCommonSchema.shape),
	z
		.strictObject({
			type: z.literal("assign"),
			viewportId: z.string().optional(),
			props: z.strictObject({}).extend(cameraCommonSchema.shape),
		})
		.extend(actionPropsCommonSchema.shape),
	z
		.strictObject({
			type: z.literal("set"),
			viewportId: z.string().optional(),
			props: z
				.strictObject({
					position: z.array(z.number()).length(3),
					target: z.array(z.number()).length(3),
				})
				.extend(cameraCommonSchema.shape),
		})
		.extend(actionPropsCommonSchema.shape),
	z
		.strictObject({
			type: z.literal("reset"),
			viewportId: z.string().optional(),
			props: z.strictObject({}).extend(cameraCommonSchema.shape),
		})
		.extend(actionPropsCommonSchema.shape),
	z
		.strictObject({
			type: z.literal("zoomTo"),
			viewportId: z.string().optional(),
			props: z
				.strictObject({
					initialPosition: z.array(z.number()).length(3).optional(),
					initialTarget: z.array(z.number()).length(3).optional(),
					nameFilter: z.array(z.string()).optional(),
				})
				.extend(cameraCommonSchema.shape),
		})
		.extend(actionPropsCommonSchema.shape),
]);

const soundActionPropsSchema = z.strictObject({
	href: z.string(),
	autoplay: z.boolean().optional(),
	loop: z.boolean().optional(),
	labelPlaying: z.string().optional(),
	iconPlaying: z.string().optional(),
});

export const ICreateModelStateDataSchema = createModelStateDataSchema;

export const validateCreateModelStateData = (value: any) => {
	return ICreateModelStateDataSchema.safeParse(value);
};

export const IImportModelStateDataSchema = importModelStateDataSchema;

export const validateImportModelStateData = (value: any) => {
	return IImportModelStateDataSchema.safeParse(value);
};

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

const triggerActionUnionSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("createModelState"),
		props: createModelStateActionPropsSchema,
	}),
	z.object({
		type: z.literal("importModelState"),
		props: z.union([IImportModelStateDataSchema, z.object({}).strict()]),
	}),
	z.object({
		type: z.literal("setParameterValue"),
		props: setParameterValueActionPropsSchema,
	}),
	z.object({
		type: z.literal("setParameterValues"),
		props: setParameterValuesActionPropsSchema,
	}),
	z.object({
		type: z.literal("undo"),
		props: emptyActionPropsSchema.optional(),
	}),
	z.object({
		type: z.literal("redo"),
		props: emptyActionPropsSchema.optional(),
	}),
	z.object({
		type: z.literal("resetParameterValues"),
		props: emptyActionPropsSchema.optional(),
	}),
	z.object({
		type: z.literal("addToCart"),
		props: addToCartActionPropsSchema,
	}),
	z.object({
		type: z.literal("camera"),
		props: cameraActionPropsSchema,
	}),
	z.object({
		type: z.literal("sound"),
		props: soundActionPropsSchema,
	}),
]);

const executeActionsSchema = z.object({
	type: z.literal("executeActions"),
	props: z.object({
		mode: z.enum(["parallel", "sequential"]).optional(),
		actions: z.array(z.lazy(() => ITriggerActionDataSchema)),
	}),
});

export const ITriggerActionDataSchema: z.ZodType<unknown> = z.union([
	triggerActionUnionSchema,
	executeActionsSchema,
]);

export const validateTriggerActionData = (value: unknown) => {
	return ITriggerActionDataSchema.safeParse(value);
};

export const IGetOutputDataSchema = z.object({
	namespace: z.string().optional(),
	output: z.string().min(1),
});

export const validateGetOutputData = (value: unknown) => {
	return IGetOutputDataSchema.safeParse(value);
};
