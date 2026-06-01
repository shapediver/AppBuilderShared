import {ResExportDefinition} from "@shapediver/sdk.geometry-api-sdk-v2";

/**
 * Reference to an export (defined by the session)
 * (duplicate of IAppBuilderExportRef to avoid importing mantine from here)
 */
interface IExportRef {
	/** Id or name or displayname of the referenced export (in that order). */
	name: string;
	/** Optional id of the session the referenced parameter belongs to. */
	sessionId?: string;
	/** Properties of the export to be overridden. */
	overrides?: Pick<
		Partial<ResExportDefinition>,
		"displayname" | "group" | "order" | "tooltip" | "hidden"
	>;
}

/**
 * Reference to an image
 * (duplicate of IAppBuilderImageRef to avoid importing mantine from here)
 */
interface IImageRef {
	/** Optional reference to export which provides the image. */
	export?: Pick<IExportRef, "name" | "sessionId">;
	/** URL to image. Can be a data URL including a base 64 encoded image. Takes precedence over export reference. */
	href?: string;
}

/**
 * Data accepted by the useCreateModelState hook to create a model state.
 */
export interface ICreateModelStateData {
	/** Optional list of parameter ids/names to include. */
	parameterNamesToInclude?: string[];
	/** Optional list of parameter names to exclude. */
	parameterNamesToExclude?: string[];
	/** Whether to include an image. */
	includeImage?: boolean;
	/** Optional image definition. If undefined, a screenshot will be used. */
	image?: IImageRef | undefined;
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
