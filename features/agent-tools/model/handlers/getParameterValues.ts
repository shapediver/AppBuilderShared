import type {ListParameterDefinitionsToolSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";
import {
	getParameterValuesInputSchema,
	type GetParameterValueItem,
} from "../../config/getParameterValues";
import type {NamespacedParameter} from "../../lib/filterParametersForAgent";
import {findParameterByName} from "../../lib/findParameterByName";
import {formatToolInputError} from "../../lib/formatToolInputError";
import {mapParameterDefinition} from "../../lib/parameterDefinitionMapper";
import {resolveParameterValueProps} from "../../lib/parameterValueProps";
import type {AgentToolsDeps} from "../agentToolsDeps";
import {collectFilteredParameters} from "../collectFilteredParameters";

function toValueItem(
	{namespace, parameter}: NamespacedParameter,
	deps: AgentToolsDeps,
): GetParameterValueItem {
	const def = parameter.definition;
	const mapped = mapParameterDefinition(parameter);
	const item: GetParameterValueItem = {
		id: def.id,
		name: def.name,
		namespace,
		currentValue: mapped.currentValue,
	};
	if (def.displayname !== undefined) {
		item.displayname = def.displayname;
	}
	// Live state, which is why it is not part of list_parameter_definitions.
	const props = resolveParameterValueProps(parameter, deps);
	if (props) {
		item.props = props;
	}
	return item;
}

/** Uses the same agent settings as `list_parameter_definitions` (intentional). */
export async function handleGetParameterValues(
	input: unknown,
	settings: ListParameterDefinitionsToolSettings,
	deps: AgentToolsDeps,
): Promise<{
	values: GetParameterValueItem[];
	errors?: {name: string; message: string}[];
}> {
	try {
		const parsed = getParameterValuesInputSchema.parse(input ?? {});
		const live = collectFilteredParameters(settings, deps).filter(
			(item) =>
				parsed.namespace === undefined ||
				item.namespace === parsed.namespace,
		);

		if (!parsed.names) {
			return {values: live.map((item) => toValueItem(item, deps))};
		}

		const parameters = live.map(({parameter}) => parameter);
		const values: GetParameterValueItem[] = [];
		const errors: {name: string; message: string}[] = [];
		for (const name of parsed.names) {
			const parameter = findParameterByName(parameters, name);
			if (!parameter) {
				errors.push({
					name,
					message: `Parameter with id/name/displayname "${name}" does not exist.`,
				});
				continue;
			}
			values.push(toValueItem(live[parameters.indexOf(parameter)], deps));
		}
		return errors.length > 0 ? {values, errors} : {values};
	} catch (e) {
		return {values: [], ...formatToolInputError(e)};
	}
}
