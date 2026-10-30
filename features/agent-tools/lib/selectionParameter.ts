import type {IShapeDiverParameterDefinition} from "@AppBuilderLib/entities/parameter/config/parameter";
import {
	SELECTION_PARAMETER_TYPE_KEY,
	selectionValueSchema,
} from "@AppBuilderLib/features/agent-tools/config/listParameterDefinitions";
import {validateSelectionParameterSettings} from "@shapediver/viewer.session";
import {parameterTypeKey} from "./parameterTypeKey";

/** Selection settings relevant to the agent, with the defaults of the selection UI applied. */
export type AgentSelectionSettings = {
	nameFilter: string[];
	minimumSelection: number;
	maximumSelection: number;
};

/**
 * Settings of a selection parameter, or `undefined` for other parameters.
 * Defaults match `ParameterSelectionComponent` (exactly one selected node).
 * Like the selection UI, invalid settings leave no node selectable.
 */
export function getSelectionSettings(
	definition: Pick<IShapeDiverParameterDefinition, "type" | "settings">,
): AgentSelectionSettings | undefined {
	if (parameterTypeKey(definition) !== SELECTION_PARAMETER_TYPE_KEY) {
		return undefined;
	}
	const result = validateSelectionParameterSettings(definition.settings);
	const props = result.success ? result.data.props : undefined;
	return {
		nameFilter: props?.nameFilter ?? [],
		minimumSelection: props?.minimumSelection ?? 1,
		maximumSelection: props?.maximumSelection ?? 1,
	};
}

/**
 * Node names of a selection value, given as `{names}` object or as its JSON
 * string (the stored format, e.g. used by setParameterValues actions).
 * The empty string is an empty selection, like in the selection UI.
 * Returns `undefined` for anything else.
 */
export function parseSelectionValue(value: unknown): string[] | undefined {
	if (value === "") return [];
	let parsed = value;
	if (typeof value === "string") {
		try {
			parsed = JSON.parse(value);
		} catch {
			return undefined;
		}
	}
	const result = selectionValueSchema.safeParse(parsed);
	return result.success ? result.data.names : undefined;
}
