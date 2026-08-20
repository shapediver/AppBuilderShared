import type {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import type {ListParameterDefinitionsToolSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";
import {getParameterValuesInputSchema} from "../../config/getParameterValues";
import {findParameterByName} from "../../lib/findParameterByName";
import {formatToolInputError} from "../../lib/formatToolInputError";
import {mapParameterDefinition} from "../../lib/parameterDefinitionMapper";
import type {AgentToolsDeps} from "../agentToolsDeps";
import {collectFilteredParameters} from "../collectFilteredParameters";

type ParameterValueItem = {
	id: string;
	name: string;
	currentValue: unknown;
};

function toValueItem(
	parameter: IShapeDiverParameter<unknown>,
): ParameterValueItem {
	const item = mapParameterDefinition(parameter);
	return {
		id: item.id,
		name: item.name,
		currentValue: item.currentValue,
	};
}

export async function handleGetParameterValues(
	input: unknown,
	settings: ListParameterDefinitionsToolSettings,
	deps: AgentToolsDeps,
): Promise<{
	values: ParameterValueItem[];
	errors?: {name: string; message: string}[];
}> {
	try {
		const parsed = getParameterValuesInputSchema.parse(input ?? {});
		const live = collectFilteredParameters(settings, deps).map(
			({parameter}) => parameter,
		);

		if (!parsed.names) {
			return {values: live.map(toValueItem)};
		}

		const values: ParameterValueItem[] = [];
		const errors: {name: string; message: string}[] = [];
		for (const name of parsed.names) {
			const parameter = findParameterByName(live, name);
			if (!parameter) {
				errors.push({
					name,
					message: `Parameter with id/name/displayname "${name}" does not exist.`,
				});
				continue;
			}
			values.push(toValueItem(parameter));
		}
		return errors.length > 0 ? {values, errors} : {values};
	} catch (e) {
		return {values: [], ...formatToolInputError(e)};
	}
}
