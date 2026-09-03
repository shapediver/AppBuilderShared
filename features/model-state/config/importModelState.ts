import {ResGetModelState} from "@shapediver/sdk.geometry-api-sdk-v2";
import type {z} from "zod";
import {
	importModelStateDataSchema,
	nameMessageSchema,
} from "./importModelState.zod";

/**
 * Data accepted by the useImportModelState hook to import a model state.
 */
export type IImportModelStateData = z.infer<typeof importModelStateDataSchema>;

type NameMessage = z.infer<typeof nameMessageSchema>;

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
			appliedParameterIds: string[];
			invalidParameters?: NameMessage[];
	  };
