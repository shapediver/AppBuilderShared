import {ResGetModelState} from "@shapediver/sdk.geometry-api-sdk-v2";
import type {z} from "zod";
import {
	importModelStateDataSchema,
	importModelStateInvalidParameterSchema,
} from "./importModelState.zod";

/**
 * Data accepted by the useImportModelState hook to import a model state.
 */
export type IImportModelStateData = z.infer<typeof importModelStateDataSchema>;

export type IImportModelStateInvalidParameter = z.infer<
	typeof importModelStateInvalidParameterSchema
>;

/**
 * Data returned from the useImportModelState hook.
 */
export type IImportModelStateResult =
	| {
			success: false;
			message: string;
			invalidParameters?: IImportModelStateInvalidParameter[];
	  }
	| {
			success: true;
			data: ResGetModelState;
			invalidParameters?: IImportModelStateInvalidParameter[];
	  };
