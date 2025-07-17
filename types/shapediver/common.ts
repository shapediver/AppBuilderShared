import {CommonsGroup} from "@shapediver/sdk.geometry-api-sdk-v2";

export interface IShapeDiverParamOrExportOrOutputDefinition {
	/** ID of the parameter or export. */
	readonly id: string;

	/** Name of the parameter or export. */
	readonly name: string;

	/** Name to be displayed instead of name. */
	readonly displayname?: string;

	/** Ordering of the parameter or export in client applications. */
	readonly order?: number;

	/** Group of the parameter or export or output. */
	readonly group?: CommonsGroup;

	/** Controls whether the parameter or export should be hidden in the UI */
	readonly hidden: boolean;
}

export interface IShapeDiverParamOrExportDefinition
	extends IShapeDiverParamOrExportOrOutputDefinition {
	/** The type of parameter or export. */
	readonly type: string;

	/** The settings of the parameter or export. */
	readonly settings?: any;
}

/**
 * A parameter or export or output.
 */
export interface IShapeDiverParamOrExportOrOutput {
	/** The static definition of a parameter or export or output. */
	readonly definition: IShapeDiverParamOrExportOrOutputDefinition;
}

/**
 * A parameter or export.
 */
export interface IShapeDiverParamOrExport {
	/** The static definition of a parameter or export. */
	readonly definition: IShapeDiverParamOrExportDefinition;
}

/**
 * Type for a 4x4 matrix.
 * Needed for the gl-matrix library.
 */
export type Mat4Array = readonly [
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
];
