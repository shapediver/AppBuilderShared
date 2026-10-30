import type {IShapeDiverParameterDefinition} from "@AppBuilderLib/entities/parameter/config/parameter";
import {SUPPORTED_PARAMETER_TYPES} from "@AppBuilderLib/features/agent-tools/config/listParameterDefinitions";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";

type TypedDefinition = Pick<
	IShapeDiverParameterDefinition,
	"type" | "settings"
>;

/**
 * Key of a parameter type and its subtype, e.g. "Interaction.selection".
 * Types without subtype are keyed by the type alone, e.g. "Float".
 */
export function parameterTypeKey(definition: TypedDefinition): string {
	const subtype =
		definition.type === ResParameterType.INTERACTION
			? (definition.settings as {type?: unknown} | undefined)?.type
			: undefined;
	return typeof subtype === "string"
		? `${definition.type}.${subtype}`
		: definition.type;
}

/** Whether `set_parameter_values` can set this parameter. */
export function isAgentSettableParameter(definition: TypedDefinition): boolean {
	return SUPPORTED_PARAMETER_TYPES.includes(parameterTypeKey(definition));
}
