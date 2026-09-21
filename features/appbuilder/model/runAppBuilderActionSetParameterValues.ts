import {resolveParameterValueSources} from "@AppBuilderLib/entities/parameter/lib/resolveParameterValueSources";
import type {ParameterValueDefinition} from "@AppBuilderLib/entities/parameter/model/useResolveParameterValues";
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {
	IAppBuilderActionPropsSetParameterValue,
	IAppBuilderActionPropsSetParameterValues,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {Logger} from "@AppBuilderLib/shared/lib/logger";

export type RunAppBuilderActionSetParameterValuesProps =
	| IAppBuilderActionPropsSetParameterValues
	| IAppBuilderActionPropsSetParameterValue;

export type AppBuilderActionRunNamespaceContext = {
	namespace: string;
	viewportId?: string;
	/** When true, missing/invalid items throw (API). UI omits this and skips. */
	strict?: boolean;
};

type PlannedParameterUpdate = {
	paramNamespace: string;
	parameterId: string;
	nextValue: unknown;
	setUiValue: (value: unknown) => boolean;
};

function rejectOrSkip(strict: boolean | undefined, message: string): void {
	if (strict) {
		throw new Error(message);
	}
	Logger.warn(message);
}

/**
 * Headless "setParameterValues" / "setParameterValue" trigger.
 * Awaits source resolution (when needed) and session execution via
 * `batchParameterValueUpdate`.
 *
 * Resolves and validates items before any `setUiValue` so a later
 * invalid/unknown entry cannot leave earlier parameters dirty. API callers
 * pass `strict: true` to throw; toolbar / slots / in-app executeActions skip
 * the bad item and continue.
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
			rejectOrSkip(
				context.strict,
				`Parameter "${item.parameter.name}" not found.`,
			);
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
		const item = items[index];
		const paramNamespace = item.parameter.sessionId ?? context.namespace;
		const parameterStore = getParameter(
			paramNamespace,
			item.parameter.name,
		);
		if (!parameterStore) {
			rejectOrSkip(
				context.strict,
				`Parameter "${item.parameter.name}" not found.`,
			);
			continue;
		}
		const parameter = parameterStore.getState();

		let nextValue: unknown = item.value;
		const isSourceValue =
			nextValue === undefined && item.source !== undefined;
		if (nextValue === undefined) {
			if (item.source === undefined) {
				rejectOrSkip(
					context.strict,
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
			rejectOrSkip(
				context.strict,
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

	if (planned.length === 0) return;

	const validParameters: {[namespace: string]: {[key: string]: unknown}} = {};
	for (const update of planned) {
		if (!update.setUiValue(update.nextValue)) {
			rejectOrSkip(
				context.strict,
				`Invalid value for parameter "${update.parameterId}".`,
			);
			continue;
		}
		if (!validParameters[update.paramNamespace]) {
			validParameters[update.paramNamespace] = {};
		}
		validParameters[update.paramNamespace][update.parameterId] =
			update.nextValue;
	}

	if (Object.keys(validParameters).length === 0) return;

	await batchParameterValueUpdate(validParameters);
}
