import {
	IAppBuilderParameterValueDefinition,
	IAppBuilderParameterValueSourceDefinition,
	isExportSource,
	isParameterSource,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import {Logger} from "@AppBuilderShared/utils/logger";
import {useMemo} from "react";
import {useParameterValueSources} from "./useParameterValueSources";

export type ParameterValueDefinition = {
	id: string;
	value: IAppBuilderParameterValueDefinition;
	namespace?: string;
};

type SourceEntry = {
	index: number;
	source: IAppBuilderParameterValueSourceDefinition;
	id: string;
	namespace?: string;
};

/**
 * Create a unique key for a parameter value source
 *
 * @param source The parameter value source
 * @returns
 */
const createSourceKey = (source: IAppBuilderParameterValueSourceDefinition) => {
	return `${source.type + ""}|${JSON.stringify(source.props)}`;
};

/**
 * Add this source and its nested sources to the flat map
 * In the process, detect cycles and avoid infinite recursion
 *
 * @param parameterInfo The parameter value definition possibly containing the source
 * @param map The flat map to add to
 * @param resolving The set of currently resolving sources (for cycle detection)
 * @param resolved The set of already resolved sources
 * @returns
 */
const addSourceToFlatMap = (
	parameterInfo: ParameterValueDefinition,
	map: Map<string, SourceEntry>,
	resolving: WeakSet<IAppBuilderParameterValueSourceDefinition>,
	resolved: WeakSet<IAppBuilderParameterValueSourceDefinition>,
) => {
	const {id, value, namespace} = parameterInfo;

	if (
		typeof value !== "object" ||
		value === null ||
		!isParameterSource(value)
	)
		return;

	// cycle detection
	// The source is already being resolved higher up in the call stack
	if (resolving.has(value)) {
		Logger.warn(
			`Cycle detected while flattening Parameter Value Sources. Source with id '${id}' is already being resolved higher up in the call stack.`,
		);
		return;
	}
	// already resolved
	if (resolved.has(value)) return;

	resolving.add(value);

	// add to map if not already present
	const key = createSourceKey(value);
	if (!map.has(key)) {
		map.set(key, {
			index: map.size,
			source: value,
			id: id,
			namespace: namespace,
		});
	}

	// check for nested sources, currently only Export sources can have nested sources
	const nested = isExportSource(value) && value.props.parameterValues;

	// recursively add nested sources
	if (nested) {
		for (const [childKey, child] of Object.entries(nested)) {
			addSourceToFlatMap(
				{id: childKey, value: child},
				map,
				resolving,
				resolved,
			);
		}
	}

	// mark as resolved
	resolving.delete(value);
	resolved.add(value);
};

/**
 * Flatten all parameter value sources (including nested ones) into a map
 *
 * @param parameterValues
 * @returns
 */
const flattenSources = (
	parameterValues?: ParameterValueDefinition[],
): Map<string, SourceEntry> => {
	const map: Map<string, SourceEntry> = new Map();

	// sets for cycle detection
	const resolving = new WeakSet<IAppBuilderParameterValueSourceDefinition>();
	const resolved = new WeakSet<IAppBuilderParameterValueSourceDefinition>();

	if (parameterValues) {
		for (const param of parameterValues) {
			addSourceToFlatMap(param, map, resolving, resolved);
		}
	}

	return map;
};

/**
 * Hook to resolve parameter values including those defined via parameter value sources.
 *
 * @param props
 * @returns
 */
export function useResolveParameterValues(props?: {
	namespace: string;
	parameterValues?: ParameterValueDefinition[];
}): string[] | undefined {
	const {namespace, parameterValues} = props || {};

	/**
	 * Flatten all parameter value sources into a map
	 * This allows us to:
	 * - only load each unique source once
	 * - not get into issues with nested sources
	 * - allows us to maintain the order of sources for the returned values
	 */
	const sourceData = useMemo(() => {
		if (!parameterValues || !namespace) return undefined;

		// flatten sources
		const flat = flattenSources(parameterValues);
		if (flat.size === 0) return undefined;

		// create sources array from map
		const sources = Array.from(flat.values()).map((e) => ({
			source: e.source,
			id: e.id,
			namespace: e.namespace,
		}));

		// create a mapping from top-level parameter id to index in the resolved sources array
		// this allows us to easily find the resolved value for each top-level parameter later
		const topLevelParameterToIndex: Record<string, number> = {};
		for (const param of parameterValues) {
			const {id, value} = param;
			if (
				typeof value === "object" &&
				value !== null &&
				isParameterSource(value)
			) {
				const entry = flat.get(createSourceKey(value));
				if (entry) {
					topLevelParameterToIndex[id] = entry.index;
				} else {
					Logger.warn(
						`Top-level parameter value source not found in flattened map for parameter ${id}.`,
					);
				}
			}
		}

		return {sources, topLevelParameterToIndex};
	}, [parameterValues, namespace]);

	// Resolve flattened sources once
	const resolvedSources = useParameterValueSources(
		sourceData && namespace
			? {
					namespace,
					sources: sourceData.sources,
				}
			: undefined,
	);

	// Once the sources are resolved, map them back to the original parameter values
	// Return exact same structure as before, the indexes match the original parameterValues array
	const resolvedParameters = useMemo(() => {
		if (!parameterValues) return undefined;

		// if the parametersValues are set, but the resolved sources are not yet available, return undefined
		if (
			parameterValues.some((param) => {
				const {value} = param;
				return (
					typeof value === "object" &&
					value !== null &&
					isParameterSource(value)
				);
			}) &&
			!resolvedSources
		) {
			return undefined;
		}

		const result: string[] = [];

		// create the result array
		for (const param of parameterValues) {
			const {id, value} = param;
			if (
				typeof value === "object" &&
				value !== null &&
				isParameterSource(value)
			) {
				const index = sourceData?.topLevelParameterToIndex[id];
				const resolvedValue =
					index !== undefined ? resolvedSources?.[index] : undefined;

				if (resolvedValue !== undefined) {
					result.push(resolvedValue + "");
				} else {
					result.push("");
					Logger.warn(
						`Could not resolve parameter value source for parameter ${id}. Setting value to empty string.`,
					);
				}
			} else {
				result.push(value + "");
			}
		}

		return result;
	}, [parameterValues, resolvedSources, sourceData]);

	return resolvedParameters;
}
