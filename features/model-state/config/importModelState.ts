import {ResGetModelState} from "@shapediver/sdk.geometry-api-sdk-v2";

/**
 * Data accepted by the useImportModelState hook to create a model state.
 */
export interface IImportModelStateData {
	/** Id of the model state to import. */
	modelStateId: string;
}

/**
 * Data returned from the useImportModelState hook.
 */
export type IImportModelStateResult =
	| {
			success: false;
			message: string;
	  }
	| {
			success: true;
			data: ResGetModelState;
	  };
