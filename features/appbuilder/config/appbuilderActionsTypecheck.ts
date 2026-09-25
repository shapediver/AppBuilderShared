import {viewportScreenshotPropsSchema} from "@AppBuilderLib/entities/viewport/config/viewportScreenshotProps.zod";
import {JsonValueSchema} from "@AppBuilderLib/features/appbuilder/config/jsonValue";
import {
	createModelStateCoreSchema,
	createModelStateImageRefSchema,
} from "@AppBuilderLib/features/model-state/config/createModelState.zod";
import {z} from "@AppBuilderLib/shared/lib/zod";
import {CAMERA_TYPE} from "@shapediver/viewer.shared.types";
import type {
	IAppBuilderActionPropsCamera,
	IAppBuilderIcon,
	IAppBuilderParameterValueSourceDefinition,
} from "./appbuilder";

/**
 * UI-free Zod for App Builder action props and parameter value sources.
 *
 * Source schemas live here with the action schemas: `setParameterValue.source`
 * embeds a source, and `modelState` sources reuse createModelState action
 * props. A separate source typecheck file would import this file and vice
 * versa.
 *
 * Settings JSON (`appbuildertypecheck.ts`) and the e-commerce CrossWindow
 * client (`ecommerceapitypecheck.ts`) must share these schemas. Do not import
 * `appbuildertypecheck.ts` from the e-commerce client — that module pulls
 * Mantine theme / widget validation.
 */

export const IAppBuilderIconSchema: z.ZodType<IAppBuilderIcon> = z.union([
	z.string(),
	z.strictObject({
		body: z.string(),
		left: z.number().optional(),
		top: z.number().optional(),
		width: z.number().optional(),
		height: z.number().optional(),
		rotate: z.number().optional(),
		hFlip: z.boolean().optional(),
		vFlip: z.boolean().optional(),
	}),
]);

export const IAppBuilderActionPropsCommonSchema = z.strictObject({
	id: z.string().optional(),
	label: z.string().optional(),
	icon: IAppBuilderIconSchema.optional(),
	tooltip: z.string().optional(),
});

export const IAppBuilderActionPropsCreateModelStateSchema =
	createModelStateCoreSchema.extend({
		image: createModelStateImageRefSchema.optional(),
		successMessage: z.string().optional(),
		errorMessage: z.string().optional(),
	});

export const IAppBuilderActionPropsAddToCartSchema = z
	.strictObject({
		productId: z.string().optional(),
		quantity: z.number().optional(),
		price: z.number().optional(),
		description: z.string().optional(),
		title: z.string().optional(),
	})
	.extend(IAppBuilderActionPropsCreateModelStateSchema.shape);

export const IAppBuilderParameterValueSourceDefinitionSchema =
	z.discriminatedUnion("type", [
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
							z.lazy(
								(): z.ZodType<IAppBuilderParameterValueSourceDefinition> =>
									IAppBuilderParameterValueSourceDefinitionSchema,
							),
						]),
					)
					.optional(),
			}),
		}),
		z.strictObject({
			type: z.literal("modelState"),
			props: IAppBuilderActionPropsCreateModelStateSchema.extend({
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
				path: z
					.string()
					.describe(
						"Path to one value in the agent tool input. `length`, `shelf.x`, or `items[0]`. A leading `$.` is accepted.",
					),
			}),
		}),
	]);

export const IAppBuilderActionPropsSetParameterValueSchema = z.strictObject({
	parameter: z.strictObject({
		name: z.string(),
		sessionId: z.string().optional(),
	}),
	value: z.string().optional(),
	source: IAppBuilderParameterValueSourceDefinitionSchema.optional(),
});

export const IAppBuilderActionPropsSetParameterValuesSchema = z.strictObject({
	parameterValues: z.array(IAppBuilderActionPropsSetParameterValueSchema),
	message: z.string().optional(),
});

export const IAppBuilderActionPropsEmptySchema = z.strictObject({});

export const IAppBuilderActionPropsUndoSchema =
	IAppBuilderActionPropsEmptySchema;
export const IAppBuilderActionPropsRedoSchema =
	IAppBuilderActionPropsEmptySchema;
export const IAppBuilderActionPropsResetParameterValuesSchema =
	IAppBuilderActionPropsEmptySchema;
export const IAppBuilderActionPropsImportModelStateSchema =
	IAppBuilderActionPropsEmptySchema;

const cameraSelectorSchema = z
	.looseObject({
		id: z.string().optional(),
		name: z.string().optional(),
		type: z.enum(CAMERA_TYPE).optional(),
	})
	.refine(
		(camera) =>
			camera.id !== undefined ||
			camera.name !== undefined ||
			camera.type !== undefined,
		{message: "camera requires id, name, or type"},
	);

export const IAppBuilderActionPropsCameraCommonSchema = z.strictObject({
	camera: cameraSelectorSchema.optional(),
	options: z.record(z.string(), JsonValueSchema).optional(),
});

const vec3Schema = z.tuple([z.number(), z.number(), z.number()]);

export const IAppBuilderActionPropsCameraSchema: z.ZodType<IAppBuilderActionPropsCamera> =
	z.discriminatedUnion("type", [
		z
			.strictObject({
				type: z.literal("animate"),
				viewportId: z.string().optional(),
				props: z
					.strictObject({
						path: z.array(
							z.strictObject({
								position: vec3Schema,
								target: vec3Schema,
							}),
						),
						startFromCurrent: z.boolean().optional(),
					})
					.extend(IAppBuilderActionPropsCameraCommonSchema.shape),
			})
			.extend(IAppBuilderActionPropsCommonSchema.shape),
		z
			.strictObject({
				type: z.literal("assign"),
				viewportId: z.string().optional(),
				props: z.strictObject({
					camera: cameraSelectorSchema,
					options: z.record(z.string(), JsonValueSchema).optional(),
				}),
			})
			.extend(IAppBuilderActionPropsCommonSchema.shape),
		z
			.strictObject({
				type: z.literal("set"),
				viewportId: z.string().optional(),
				props: z
					.strictObject({
						position: vec3Schema,
						target: vec3Schema,
					})
					.extend(IAppBuilderActionPropsCameraCommonSchema.shape),
			})
			.extend(IAppBuilderActionPropsCommonSchema.shape),
		z
			.strictObject({
				type: z.literal("reset"),
				viewportId: z.string().optional(),
				props: z
					.strictObject({})
					.extend(IAppBuilderActionPropsCameraCommonSchema.shape),
			})
			.extend(IAppBuilderActionPropsCommonSchema.shape),
		z
			.strictObject({
				type: z.literal("zoomTo"),
				viewportId: z.string().optional(),
				props: z
					.strictObject({
						initialPosition: vec3Schema.optional(),
						initialTarget: vec3Schema.optional(),
						nameFilter: z.array(z.string()).optional(),
					})
					.extend(IAppBuilderActionPropsCameraCommonSchema.shape),
			})
			.extend(IAppBuilderActionPropsCommonSchema.shape),
	]) as z.ZodType<IAppBuilderActionPropsCamera>;

export const IAppBuilderActionPropsSoundSchema = z.strictObject({
	href: z.string(),
	autoplay: z.boolean().optional(),
	loop: z.boolean().optional(),
	labelPlaying: z.string().optional(),
	iconPlaying: IAppBuilderIconSchema.optional(),
});
