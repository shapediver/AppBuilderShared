import type {IAppBuilderActionPropsCreateModelState} from "@AppBuilderLib/features/appbuilder/config/appbuilderActions";

/**
 * Data accepted when creating a model state (hook, e-commerce connector, stores).
 * App Builder `createModelState` action props plus optional custom `data`.
 */
export type ICreateModelStateData = Omit<
	IAppBuilderActionPropsCreateModelState,
	"successMessage" | "errorMessage"
> & {
	data?: Record<string, unknown>;
};

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
