import {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import type {IShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/config/shapediverStoreParameters";
import {SUPPORTED_PARAMETER_TYPES} from "@AppBuilderLib/features/agent-tools/config/listParameterDefinitions";
import type {
	ParameterUpdateInput,
	SetParameterValuesError,
	SetParameterValuesOutput,
} from "@AppBuilderLib/features/agent-tools/config/setParameterValues";
import {findParameterByName} from "./findParameterByName";
import {prepareParameterStoreValue} from "./setParameterValueValidators/prepareParameterStoreValue";

type PrepareOneUpdateResult =
	| {
			ok: true;
			paramId: string;
			namespace: string;
			storeValue: unknown;
	  }
	| {ok: false; error: SetParameterValuesError};

function prepareOneUpdate(
	update: ParameterUpdateInput,
	defaultNamespace: string,
	getParameters: (namespace: string) => IShapeDiverParameter<any>[],
	processedIds: Set<string>,
): PrepareOneUpdateResult {
	const targetNamespace = update.sessionId ?? defaultNamespace;
	const parameter = findParameterByName(
		getParameters(targetNamespace),
		update.name,
	);

	if (!parameter) {
		return {
			ok: false,
			error: {
				name: update.name,
				message: `Parameter with id/name/displayname "${update.name}" does not exist.`,
			},
		};
	}

	const paramId = parameter.definition.id;
	if (processedIds.has(paramId)) {
		return {
			ok: false,
			error: {
				name: update.name,
				message: `Refusing to update parameter "${update.name}" twice.`,
			},
		};
	}
	processedIds.add(paramId);

	if (!SUPPORTED_PARAMETER_TYPES.includes(parameter.definition.type)) {
		return {
			ok: false,
			error: {
				name: update.name,
				message: `Parameter type "${parameter.definition.type}" is not supported for setting via WebMCP.`,
			},
		};
	}

	const prepared = prepareParameterStoreValue(parameter, update.value);
	if (!prepared.success) {
		return {
			ok: false,
			error: {name: update.name, message: prepared.message},
		};
	}

	return {
		ok: true,
		paramId,
		namespace: targetNamespace,
		storeValue: prepared.storeValue,
	};
}

/**
 * Validate each update, then batch-write applied values.
 * Does not apply the agent parameter filter — any live param in the namespace can be set.
 */
export async function applyParameterUpdates(
	defaultNamespace: string,
	getParameters: (namespace: string) => IShapeDiverParameter<any>[],
	updates: ParameterUpdateInput[],
	batchUpdate: IShapeDiverStoreParameters["batchParameterValueUpdate"],
): Promise<SetParameterValuesOutput> {
	const errors: SetParameterValuesError[] = [];
	const valuesByNamespace: Record<string, Record<string, unknown>> = {};
	const processedIds = new Set<string>();

	for (const update of updates) {
		const prepared = prepareOneUpdate(
			update,
			defaultNamespace,
			getParameters,
			processedIds,
		);
		if (!prepared.ok) {
			errors.push(prepared.error);
			continue;
		}

		(valuesByNamespace[prepared.namespace] ??= {})[prepared.paramId] =
			prepared.storeValue;
	}

	const applied = Object.values(valuesByNamespace).flatMap(Object.keys);
	if (applied.length > 0) {
		await batchUpdate(valuesByNamespace);
	}

	return {applied, errors};
}
