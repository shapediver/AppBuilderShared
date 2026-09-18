import type {ResGetModelState} from "@shapediver/sdk.geometry-api-sdk-v2";

/**
 * Data accepted by the useImportModelState hook to import a model state.
 */
export interface IImportModelStateData {
	modelStateId: string;
}

type NameMessage = {
	name: string;
	message: string;
};

/**
 * Data returned from the useImportModelState hook.
 */
export type IImportModelStateResult =
	| {
			success: false;
			message: string;
			invalidParameters?: NameMessage[];
	  }
	| {
			success: true;
			data: ResGetModelState;
			invalidParameters?: NameMessage[];
	  };
