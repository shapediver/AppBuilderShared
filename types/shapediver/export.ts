import {IShapeDiverParamOrExport} from "@AppBuilderShared/types/shapediver/common";
import {
	ResExport,
	ResExportDefinition,
} from "@shapediver/sdk.geometry-api-sdk-v2";

/**
 * The static definition of an export.
 * We reuse the definition of the export on the Geometry Backend here.
 */
export type IShapeDiverExportDefinition = ResExportDefinition;

/**
 * Actions which can be taken on an export.
 */
export interface IShapeDiverExportActions {
	/**
	 * Request the export.
	 *
	 * @param parameters Parameter values to be used for this export request. Map from parameter id to parameter value.
	 *                   The currently executed value will be used for any parameter not specified.
	 *
	 * @throws {@type ShapeDiverViewerError}
	 */
	request(parameters?: {[key: string]: string}): Promise<ResExport>;

	/**
	 * Fetch the export from the given URL. Use this in case the model is configured to require a JWT for every request.
	 *
	 * @param url The URL of the export to fetch.
	 */
	fetch(url: string): Promise<Response>;
}

/**
 * An export including its definition (static properties) and its state.
 */
export interface IShapeDiverExport extends IShapeDiverParamOrExport {
	/** The static definition of the export. */
	readonly definition: IShapeDiverExportDefinition;

	/**
	 * Actions which can be taken on the export.
	 */
	readonly actions: IShapeDiverExportActions;
}
