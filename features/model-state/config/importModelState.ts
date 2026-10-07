import type {ResGetModelState} from "@shapediver/sdk.geometry-api-sdk-v2";

import type {
	IModelStateWireImportData,
	IModelStateWireImportResult,
} from "./modelStateWire";

/**
 * Data accepted by the useImportModelState hook to import a model state.
 */
export type IImportModelStateData = IModelStateWireImportData;

/**
 * Data returned from the useImportModelState hook.
 * `data` is the Geometry Backend model state.
 */
export type IImportModelStateResult =
	IModelStateWireImportResult<ResGetModelState>;
