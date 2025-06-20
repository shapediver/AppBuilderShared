import {IShapeDiverParamOrExport} from "@AppBuilderShared/types/shapediver/common";
import {IOutputApi} from "@shapediver/viewer.session";
import {OutputApi} from "@shapediver/viewer.session/dist/implementation/OutputApi";

/**
 * The static definition of an output.
 * We use the IOutputApi from the viewer session here.
 */
export interface IShapeDiverOutputDefinition {
	/** ID of the output. */
	readonly id: OutputApi["id"];
	/** UID of the output. */
	readonly uid?: OutputApi["uid"];
	/** The chunks of the output. */
	readonly chunks: OutputApi["chunks"];
	/** Name of the output. */
	readonly name: OutputApi["name"];
	/** Name to be displayed instead of name. */
	readonly displayname?: OutputApi["displayname"];
	/** Ordering of the output in client applications. */
	readonly order?: OutputApi["order"];
	/** Controls whether the output should be hidden in the UI */
	readonly hidden: OutputApi["hidden"];
	/** The format of the output. */
	readonly format?: OutputApi["format"];
	/** The node of the output. */
	readonly node?: OutputApi["node"];
}

/**
 * An output including its definition (static properties).
 */
export interface IShapeDiverOutput extends IShapeDiverParamOrExport {
	/** The static definition of the output. */
	readonly definition: IShapeDiverOutputDefinition;
	/**
	 * Reference to the underlying output API.
	 */
	readonly outputApi: IOutputApi;
}
