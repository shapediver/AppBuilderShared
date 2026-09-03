import {parameterValueSchema} from "@AppBuilderLib/features/agent-tools/config/listParameterDefinitions";
import {z} from "@AppBuilderLib/shared/lib/zod";

export type ParameterValueInput = z.infer<typeof parameterValueSchema>;

export type ParameterValuePrepareResult =
	| {success: true; storeValue: unknown}
	| {success: false; message: string};
