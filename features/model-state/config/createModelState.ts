import type {z} from "zod";
import {createModelStateDataSchema} from "./createModelState.zod";
export {
	createModelStateCoreSchema,
	createModelStateDataSchema,
	createModelStateImageRefSchema,
} from "./createModelState.zod";

/**
 * Data accepted by the useCreateModelState hook to create a model state.
 */
export type ICreateModelStateData = z.infer<typeof createModelStateDataSchema>;

/**
 * Data returned from the useCreateModelState hook.
 */
export interface ICreateModelStateResult {
	/** Id of created model state. */
	modelStateId?: string;
	/** Data URL of the created screenshot or href to a specified image (either via export or directly) */
	screenshot?: string;
	/** Model view URL of the Geometry Backend system the model state was created on. */
	modelViewUrl?: string;
	/** URL of the image saved as part of the model state. */
	modelStateImageUrl?: string;
	/** URL of the glTF asset saved as part of the model state. */
	modelStateGltfUrl?: string;
	/** URL of the usdz asset saved as part of the model state. */
	modelStateUsdzUrl?: string;
}
