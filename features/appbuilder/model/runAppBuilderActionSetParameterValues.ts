import {resolveParameterValueSources} from "@AppBuilderLib/entities/parameter/lib/resolveParameterValueSources";
import type {ParameterValueDefinition} from "@AppBuilderLib/entities/parameter/model/useResolveParameterValues";
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {
	IAppBuilderActionPropsSetParameterValue,
	IAppBuilderActionPropsSetParameterValues,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";

export type RunAppBuilderActionSetParameterValuesProps =
	| IAppBuilderActionPropsSetParameterValues
	| IAppBuilderActionPropsSetParameterValue;

export type AppBuilderActionRunNamespaceContext = {
	namespace: string;
	viewportId?: string;
};

type PlannedParameterUpdate = {
	paramNamespace: string;
	parameterId: string;
	nextValue: unknown;
	setUiValue: (value: unknown) => boolean;
};

/**
 * Headless "setParameterValues" / "setParameterValue" trigger.
 * Awaits source resolution (when needed) and session execution via
 * `batchParameterValueUpdate`.
 *
 * Resolves and validates the complete batch before any `setUiValue` so a
 * later invalid/unknown entry cannot leave earlier parameters dirty.
 */
export async function runAppBuilderActionSetParameterValues(
	props: RunAppBuilderActionSetParameterValuesProps,
	context: AppBuilderActionRunNamespaceContext,
): Promise<void> {
	const items = "parameterValues" in props ? props.parameterValues : [props];
	const {getParameter, batchParameterValueUpdate} =
		useShapeDiverStoreParameters.getState();

	const sourceDefinitions: ParameterValueDefinition[] = [];
	const sourceItemIndexes: number[] = [];

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
			throw new Error(`Parameter "${item.parameter.name}" not found.`);
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
		const item = items[index];
		const paramNamespace = item.parameter.sessionId ?? context.namespace;
		const parameterStore = getParameter(
			paramNamespace,
			item.parameter.name,
		);
		if (!parameterStore) {
			throw new Error(`Parameter "${item.parameter.name}" not found.`);
		}
		const parameter = parameterStore.getState();

		let nextValue: unknown = item.value;
		const isSourceValue =
			nextValue === undefined && item.source !== undefined;
		if (nextValue === undefined) {
			if (item.source === undefined) {
				throw new Error(
					`No value or source defined for parameter "${parameter.definition.id}".`,
				);
			}
			if (!sourceItemIndexes.includes(index)) continue;
			nextValue = resolvedSources?.[resolvedSourceIndex++] ?? "";
		}

		if (!isSourceValue && !parameter.actions.isUiValueDifferent(nextValue))
			continue;
		if (!parameter.actions.isValid(nextValue, false)) {
			throw new Error(
				`Invalid value for parameter "${parameter.definition.id}".`,
			);
		}
		planned.push({
			paramNamespace,
			parameterId: parameter.definition.id,
			nextValue,
			setUiValue: (value) => parameter.actions.setUiValue(value),
		});
	}

	if (planned.length === 0) return;

	const validParameters: {[namespace: string]: {[key: string]: unknown}} = {};
	for (const update of planned) {
		if (!update.setUiValue(update.nextValue)) {
			throw new Error(
				`Invalid value for parameter "${update.parameterId}".`,
			);
		}
		if (!validParameters[update.paramNamespace]) {
			validParameters[update.paramNamespace] = {};
		}
		validParameters[update.paramNamespace][update.parameterId] =
			update.nextValue;
	}

	await batchParameterValueUpdate(validParameters);
}
