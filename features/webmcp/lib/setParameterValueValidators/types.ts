import type {z} from "@AppBuilderLib/shared/lib/zod";
import {parameterValueSchema} from "../../core/listParameterDefinitions";

export type ParameterValueInput = z.infer<typeof parameterValueSchema>;

export type ParameterValuePrepareResult =
	| {success: true; storeValue: unknown}
	| {success: false; message: string};
