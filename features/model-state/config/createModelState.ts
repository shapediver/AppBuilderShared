import {IAppBuilderImageRef} from "@AppBuilderShared/features/appbuilder/config/appbuilder";

/**
 * Data accepted by the useCreateModelState hook to create a model state.
 */
export interface ICreateModelStateData {
	/** Optional list of parameter ids/names to include. */
	parameterNamesToInclude: string[] | undefined;
	/** Optional list of parameter names to exclude. */
	parameterNamesToExclude: string[] | undefined;
	/** Whether to include an image. */
	includeImage?: boolean;
	/** Optional image definition. If undefined, a screenshot will be used. */
	image?: IAppBuilderImageRef | undefined;
	/** Optional data to include with the saved model state. */
	data?: Record<string, any>;
	/** Whether to save a glTF of the scene. */
	includeGltf?: boolean;
}

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
