import {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import type {IShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/config/shapediverStoreParameters";
import {projectNumericSliderValue} from "@AppBuilderLib/entities/parameter/lib/numericSliderValue";
import type {
	ParameterUpdateInput,
	ParameterValueAdjustment,
	SetParameterValuesError,
	SetParameterValuesOutput,
} from "@AppBuilderLib/features/agent-tools/config/setParameterValues";
import type {AppBuilderSetParameterValuesUpdateMode} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {findParameterByName} from "./findParameterByName";
import {isAgentSettableParameter} from "./parameterTypeKey";
import {prepareParameterStoreValue} from "./setParameterValueValidators/prepareParameterStoreValue";
import type {ParameterValuePrepareContext} from "./setParameterValueValidators/types";

type PrepareOneUpdateResult =
	| {
			ok: true;
			paramId: string;
			namespace: string;
			storeValue: unknown;
			adjustment?: ParameterValueAdjustment;
	  }
	| {ok: false; error: SetParameterValuesError};

function finiteNumber(value: unknown): number | undefined {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string" && value.trim() !== "") {
		const parsed = Number(value);
		if (Number.isFinite(parsed)) return parsed;
	}
	return undefined;
}

function prepareOneUpdate(
	update: ParameterUpdateInput,
	defaultNamespace: string,
	getParameters: (namespace: string) => IShapeDiverParameter<any>[],
	processedIds: Set<string>,
	context: ParameterValuePrepareContext,
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

	if (!isAgentSettableParameter(parameter.definition)) {
		return {
			ok: false,
			error: {
				name: update.name,
				message: `Parameter type "${parameter.definition.type}" is not supported for setting via agent tools.`,
			},
		};
	}

	const prepared = prepareParameterStoreValue(
		parameter,
		update.value,
		context,
	);
	if (!prepared.success) {
		return {
			ok: false,
			error: {name: update.name, message: prepared.message},
		};
	}

	const requested = finiteNumber(prepared.storeValue);
	if (requested !== undefined) {
		const projected = projectNumericSliderValue(
			parameter.definition,
			requested,
		);
		if (projected !== undefined && projected !== requested) {
			return {
				ok: true,
				paramId,
				namespace: targetNamespace,
				storeValue: projected,
				adjustment: {
					name: update.name,
					requested,
					value: projected,
				},
			};
		}
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
 *
 * `updateMode` `"partial"` (default) writes the valid updates and still
 * returns every error. `"complete"` writes nothing when any update fails.
 * `context` provides the available node names for selection parameters.
 */
export async function applyParameterUpdates(
	defaultNamespace: string,
	getParameters: (namespace: string) => IShapeDiverParameter<any>[],
	updates: ParameterUpdateInput[],
	batchUpdate: IShapeDiverStoreParameters["batchParameterValueUpdate"],
	updateMode: AppBuilderSetParameterValuesUpdateMode = "partial",
	context: ParameterValuePrepareContext = {},
): Promise<SetParameterValuesOutput> {
	const errors: SetParameterValuesError[] = [];
	const adjustments: ParameterValueAdjustment[] = [];
	const valuesByNamespace: Record<string, Record<string, unknown>> = {};
	const processedIds = new Set<string>();

	for (const update of updates) {
		const prepared = prepareOneUpdate(
			update,
			defaultNamespace,
			getParameters,
			processedIds,
			context,
		);
		if (!prepared.ok) {
			errors.push(prepared.error);
			continue;
		}

		(valuesByNamespace[prepared.namespace] ??= {})[prepared.paramId] =
			prepared.storeValue;
		if (prepared.adjustment) adjustments.push(prepared.adjustment);
	}

	const blockAll = updateMode === "complete" && errors.length > 0;
	const applied = blockAll
		? []
		: Object.values(valuesByNamespace).flatMap(Object.keys);
	if (!blockAll && applied.length > 0) {
		await batchUpdate(valuesByNamespace);
	}

	return {
		applied,
		errors,
		...(blockAll || adjustments.length === 0 ? {} : {adjustments}),
	};
}
