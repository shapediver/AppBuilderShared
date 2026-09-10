import type {ListParameterDefinitionsToolSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";
import {
	listParameterDefinitionsInputSchema,
	type ListParameterDefinitionItem,
} from "../../config/listParameterDefinitions";
import {formatToolInputError} from "../../lib/formatToolInputError";
import {mapParameterDefinition} from "../../lib/parameterDefinitionMapper";
import type {AgentToolsDeps} from "../agentToolsDeps";
import {collectFilteredParameters} from "../collectFilteredParameters";

export async function handleListParameterDefinitions(
	input: unknown,
	settings: ListParameterDefinitionsToolSettings,
	deps: AgentToolsDeps,
): Promise<{
	parameters: ListParameterDefinitionItem[];
	errors?: {name: string; message: string}[];
}> {
	try {
		listParameterDefinitionsInputSchema.parse(input ?? {});
		const filtered = collectFilteredParameters(settings, deps);
		return {
			parameters: filtered.map(({namespace, parameter}) => ({
				...mapParameterDefinition(parameter),
				namespace,
			})),
		};
	} catch (e) {
		return {parameters: [], ...formatToolInputError(e)};
	}
}
