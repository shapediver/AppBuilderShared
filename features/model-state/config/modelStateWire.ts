/**
 * Cross-window model-state contract shared by ToolsApi and the model-state
 * stores. This file imports nothing so the agent-window client can depend on
 * it. Store callers extend these types with App Builder and Geometry Backend
 * fields.
 */

/** Create-model-state payload sent across a window boundary. */
export interface IModelStateWireCreateData {
	parameterNamesToInclude?: string[];
	parameterNamesToExclude?: string[];
	includeImage?: boolean;
	includeGltf?: boolean;
	data?: Record<string, unknown>;
}

/** Result of creating a model state. */
export interface IModelStateWireCreateResult {
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

/** Payload for loading a saved model state. */
export interface IModelStateWireImportData {
	modelStateId: string;
}

/**
 * Reply from loading a saved model state.
 * `TData` is `unknown` on the wire and the Geometry Backend model state in the store.
 */
export type IModelStateWireImportResult<TData = unknown> =
	| {
			success: false;
			message: string;
			invalidParameters?: {name: string; message: string}[];
	  }
	| {
			success: true;
			data: TData;
			invalidParameters?: {name: string; message: string}[];
	  };
