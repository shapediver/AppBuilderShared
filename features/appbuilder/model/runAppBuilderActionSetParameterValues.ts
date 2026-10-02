import {resolveParameterValueSources} from "@AppBuilderLib/entities/parameter/lib/resolveParameterValueSources";
import type {ParameterValueDefinition} from "@AppBuilderLib/entities/parameter/model/useResolveParameterValues";
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {
	type AppBuilderSetParameterValuesUpdateMode,
	IAppBuilderActionPropsSetParameterValue,
	IAppBuilderActionPropsSetParameterValues,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";

export type RunAppBuilderActionSetParameterValuesProps =
	| IAppBuilderActionPropsSetParameterValues
	| IAppBuilderActionPropsSetParameterValue;

export type AppBuilderActionRunNamespaceContext = {
	namespace: string;
	viewportId?: string;
	/**
	 * Accepted from `AppBuilderActionRunContext`. Camera uses it.
	 * This action fails on an invalid item either way; `updateMode` chooses
	 * whether valid siblings are written first.
	 */
	strict?: boolean;
};

type PlannedParameterUpdate = {
	paramNamespace: string;
	parameterId: string;
	nextValue: unknown;
	setUiValue: (value: unknown) => boolean;
};

function updateModeOf(
	props: RunAppBuilderActionSetParameterValuesProps,
): AppBuilderSetParameterValuesUpdateMode {
	return "parameterValues" in props
		? (props.updateMode ?? "partial")
		: "partial";
}

/**
 * Headless "setParameterValues" / "setParameterValue" trigger.
 * Awaits source resolution (when needed) and session execution via
 * `batchParameterValueUpdate`.
 *
 * When one value is unknown, missing, or invalid, `updateMode` chooses
 * what happens to the other values in this action:
 * - `"partial"` (default): write the valid values, then fail with the
 *   first error message. Earlier actions in a sequence stay applied.
 * - `"complete"`: leave every value in this action unchanged, then fail
 *   with the first error message. A write happens only when every value
 *   is valid.
 *
 * An `agentTool` value source fails the action before any write.
 */
export async function runAppBuilderActionSetParameterValues(
	props: RunAppBuilderActionSetParameterValuesProps,
	context: AppBuilderActionRunNamespaceContext,
): Promise<void> {
	const items = "parameterValues" in props ? props.parameterValues : [props];
	const updateMode = updateModeOf(props);
	const {getParameter, batchParameterValueUpdate} =
		useShapeDiverStoreParameters.getState();

	const sourceDefinitions: ParameterValueDefinition[] = [];
	const sourceItemIndexes: number[] = [];
	const errors: string[] = [];
	const failedIndexes = new Set<number>();

	const noteError = (index: number, message: string) => {
		if (failedIndexes.has(index)) return;
		failedIndexes.add(index);
		errors.push(message);
	};

	for (let index = 0; index < items.length; index++) {
		const item = items[index];
		if (item.value !== undefined || item.source === undefined) continue;
		if (item.source.type === "agentTool") {
			throw new Error(
				"executeActions cannot resolve an agentTool parameter value source.",
			);
		}
		const paramNamespace = item.parameter.sessionId ?? context.namespace;
		const parameterStore = getParameter(
			paramNamespace,
			item.parameter.name,
		);
		if (!parameterStore) {
			noteError(index, `Parameter "${item.parameter.name}" not found.`);
			continue;
		}
		sourceDefinitions.push({
			id: parameterStore.getState().definition.id,
			value: item.source,
			namespace: paramNamespace,
		});
		sourceItemIndexes.push(index);
	}

	const resolvedSources =
		sourceDefinitions.length > 0
			? await resolveParameterValueSources(sourceDefinitions, context)
			: undefined;

	const planned: PlannedParameterUpdate[] = [];
	let resolvedSourceIndex = 0;

	for (let index = 0; index < items.length; index++) {
		if (failedIndexes.has(index)) continue;
		const item = items[index];
		const paramNamespace = item.parameter.sessionId ?? context.namespace;
		const parameterStore = getParameter(
			paramNamespace,
			item.parameter.name,
		);
		if (!parameterStore) {
			noteError(index, `Parameter "${item.parameter.name}" not found.`);
			continue;
		}
		const parameter = parameterStore.getState();

		let nextValue: unknown = item.value;
		const isSourceValue =
			nextValue === undefined && item.source !== undefined;
		if (nextValue === undefined) {
			if (item.source === undefined) {
				noteError(
					index,
					`No value or source defined for parameter "${parameter.definition.id}".`,
				);
				continue;
			}
			if (!sourceItemIndexes.includes(index)) continue;
			nextValue = resolvedSources?.[resolvedSourceIndex++] ?? "";
		}

		if (!isSourceValue && !parameter.actions.isUiValueDifferent(nextValue))
			continue;
		if (!parameter.actions.isValid(nextValue, false)) {
			noteError(
				index,
				`Invalid value for parameter "${parameter.definition.id}".`,
			);
			continue;
		}
		planned.push({
			paramNamespace,
			parameterId: parameter.definition.id,
			nextValue,
			setUiValue: (value) => parameter.actions.setUiValue(value),
		});
	}

	if (updateMode === "complete" && errors.length > 0) {
		throw new Error(errors[0]);
	}

	const validParameters: {[namespace: string]: {[key: string]: unknown}} = {};
	for (const update of planned) {
		if (!update.setUiValue(update.nextValue)) {
			errors.push(`Invalid value for parameter "${update.parameterId}".`);
			continue;
		}
		if (!validParameters[update.paramNamespace]) {
			validParameters[update.paramNamespace] = {};
		}
		validParameters[update.paramNamespace][update.parameterId] =
			update.nextValue;
	}

	if (Object.keys(validParameters).length > 0) {
		await batchParameterValueUpdate(validParameters);
	}

	if (errors.length > 0) {
		throw new Error(errors[0]);
	}
}
