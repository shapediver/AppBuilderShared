import {parameterValueSchema} from "@AppBuilderLib/features/agent-tools/config/listParameterDefinitions";
import {z} from "@AppBuilderLib/shared/lib/zod";

export type ParameterValueInput = z.infer<typeof parameterValueSchema>;

export type ParameterValuePrepareResult =
	{success: true; storeValue: unknown} | {success: false; message: string};

export type ParameterValuePrepareContext = {
	/** Names of the scene nodes currently matching a selection nameFilter. */
	getAvailableNodes?: (nameFilter: string[]) => string[];
};
