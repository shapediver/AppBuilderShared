import {IShapeDiverParamOrExportOrOutput} from "@AppBuilderLib/entities/parameter/config/common";
import {
	ResOutputContent,
	ResOutputDefinition,
} from "@shapediver/sdk.geometry-api-sdk-v2";

/**
 * The static definition of an output.
 * We reuse the definition of the output on the Geometry Backend here.
 */
export type IShapeDiverOutputDefinition = ResOutputDefinition;

export type IShapeDiverOutputDefinitionChunk = NonNullable<
	IShapeDiverOutputDefinition["chunks"]
>[number];

/**
 * An output including its definition (static properties).
 */
export interface IShapeDiverOutput extends IShapeDiverParamOrExportOrOutput {
	/** The static definition of the output. */
	readonly definition: IShapeDiverOutputDefinition;
	/** Content provided by the output. */
	readonly content: ResOutputContent[] | undefined;
}
