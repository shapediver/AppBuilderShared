import type {z} from "zod";
import {parameterValueSchema} from "../../config/listParameterDefinitions";

export type ParameterValueInput = z.infer<typeof parameterValueSchema>;

export type ParameterValuePrepareResult =
	| {success: true; storeValue: unknown}
	| {success: false; message: string};
