import type {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import type {ParameterValueProps} from "@AppBuilderLib/features/agent-tools/config/getParameterValues";
import {SELECTION_PARAMETER_TYPE_KEY} from "@AppBuilderLib/features/agent-tools/config/listParameterDefinitions";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import type {AgentToolsDeps} from "../model/agentToolsDeps";
import {parameterTypeKey} from "./parameterTypeKey";
import {getSelectionSettings} from "./selectionParameter";

type ValuePropsResolver = (
	parameter: IShapeDiverParameter<unknown>,
	deps: AgentToolsDeps,
) => ParameterValueProps | undefined;

/** Live, type-specific props per parameter type + subtype, see `parameterTypeKey`. */
const VALUE_PROPS_RESOLVERS: {[typeKey: string]: ValuePropsResolver} = {
	[SELECTION_PARAMETER_TYPE_KEY]: (parameter, deps) => {
		const selection = getSelectionSettings(parameter.definition);
		if (!selection) return undefined;
		return {
			type: ResParameterType.INTERACTION,
			settings: {type: "selection"},
			availableNodes: deps.getAvailableNodes(selection.nameFilter) ?? [],
		};
	},
};

/**
 * Type-specific live state of a parameter for get_parameter_values,
 * or `undefined` for types without such state.
 */
export function resolveParameterValueProps(
	parameter: IShapeDiverParameter<unknown>,
	deps: AgentToolsDeps,
): ParameterValueProps | undefined {
	return VALUE_PROPS_RESOLVERS[parameterTypeKey(parameter.definition)]?.(
		parameter,
		deps,
	);
}
