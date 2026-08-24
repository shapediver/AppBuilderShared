import {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import type {IShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/config/shapediverStoreParameters";
import {SUPPORTED_PARAMETER_TYPES} from "../core/listParameterDefinitions";
import type {
	ParameterUpdateInput,
	SetParameterValuesError,
	SetParameterValuesOutput,
} from "../core/setParameterValues";
import {prepareParameterStoreValue} from "./setParameterValueValidators/prepareParameterStoreValue";

function findParameterByName(
	parameters: IShapeDiverParameter<any>[],
	name: string,
): IShapeDiverParameter<any> | undefined {
	return parameters.find(
		(p) =>
			p.definition.id === name ||
			p.definition.name === name ||
			p.definition.displayname === name,
	);
}

export async function resolveAndUpdate(
	defaultNamespace: string,
	getParameters: (namespace: string) => IShapeDiverParameter<any>[],
	updates: ParameterUpdateInput[],
	batchUpdate: IShapeDiverStoreParameters["batchParameterValueUpdate"],
): Promise<SetParameterValuesOutput> {
	const errors: SetParameterValuesError[] = [];
	const valuesByNamespace: Record<string, Record<string, unknown>> = {};
	const processedIds = new Set<string>();

	for (const update of updates) {
		const targetNamespace = update.sessionId ?? defaultNamespace;
		const parameter = findParameterByName(
			getParameters(targetNamespace),
			update.name,
		);

		if (!parameter) {
			errors.push({
				name: update.name,
				message: `Parameter with id/name/displayname "${update.name}" does not exist.`,
			});
			continue;
		}

		const paramId = parameter.definition.id;
		if (processedIds.has(paramId)) {
			errors.push({
				name: update.name,
				message: `Refusing to update parameter "${update.name}" twice.`,
			});
			continue;
		}
		processedIds.add(paramId);

		if (!SUPPORTED_PARAMETER_TYPES.includes(parameter.definition.type)) {
			errors.push({
				name: update.name,
				message: `Parameter type "${parameter.definition.type}" is not supported for setting via WebMCP.`,
			});
			continue;
		}

		const prepared = prepareParameterStoreValue(parameter, update.value);
		if (!prepared.success) {
			errors.push({name: update.name, message: prepared.message});
			continue;
		}

		(valuesByNamespace[targetNamespace] ??= {})[paramId] =
			prepared.storeValue;
	}

	const applied = Object.values(valuesByNamespace).flatMap(Object.keys);
	if (applied.length > 0) {
		await batchUpdate(valuesByNamespace);
	}

	return {applied, errors};
}
