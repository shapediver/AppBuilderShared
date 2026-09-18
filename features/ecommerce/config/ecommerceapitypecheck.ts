import {
	IAppBuilderActionPropsAddToCartSchema,
	IAppBuilderActionPropsCameraSchema,
	IAppBuilderActionPropsCreateModelStateSchema,
	IAppBuilderActionPropsSetParameterValueSchema,
	IAppBuilderActionPropsSetParameterValuesSchema,
	IAppBuilderActionPropsSoundSchema,
} from "@AppBuilderLib/features/appbuilder/config/appbuilderactionstypecheck";
import {createModelStateDataSchema} from "@AppBuilderLib/features/model-state/config/createModelState.zod";
import {importModelStateDataSchema} from "@AppBuilderLib/features/model-state/config/importModelState.zod";
import {z} from "@AppBuilderLib/shared/lib/zod";
import type {ITriggerActionData} from "./ecommerceapi";

/**
 * E-commerce CrossWindow request validation.
 *
 * Action prop schemas live in `appbuilderactionstypecheck.ts` so they stay
 * identical to App Builder settings JSON. This file only adds connector-only
 * payloads and the triggerAction allowlist (a subset of action types).
 * Public types live in `ecommerceapi.ts` / `appbuilderactions.ts`, not `z.infer`.
 */

const emptyActionPropsSchema = z.strictObject({});

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
		props: IAppBuilderActionPropsCreateModelStateSchema,
	}),
	z.object({
		type: z.literal("importModelState"),
		props: z.union([IImportModelStateDataSchema, z.object({}).strict()]),
	}),
	z.object({
		type: z.literal("setParameterValue"),
		props: IAppBuilderActionPropsSetParameterValueSchema,
	}),
	z.object({
		type: z.literal("setParameterValues"),
		props: IAppBuilderActionPropsSetParameterValuesSchema,
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
		props: IAppBuilderActionPropsAddToCartSchema,
	}),
	z.object({
		type: z.literal("camera"),
		props: IAppBuilderActionPropsCameraSchema,
	}),
	z.object({
		type: z.literal("sound"),
		props: IAppBuilderActionPropsSoundSchema,
	}),
]);

const executeActionsSchema = z.object({
	type: z.literal("executeActions"),
	props: z.object({
		mode: z.enum(["parallel", "sequential"]).optional(),
		actions: z.array(z.lazy(() => ITriggerActionDataSchema)),
	}),
});

export const ITriggerActionDataSchema: z.ZodType<ITriggerActionData> = z.union([
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
