import {
	IAppBuilderParameterValueDefinition,
	IAppBuilderParameterValueSourceDefinition,
	isExportSource,
	isParameterSource,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import {Logger} from "@AppBuilderShared/utils/logger";
import {useEffect, useMemo, useState} from "react";
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
	// For export sources with nested sources, track the nested source keys and their resolved values
	nestedSourceKeys?: Map<string, string>;
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
	resolved: WeakSet<IAppBuilderParameterValueSourceDefinition>
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

	// check for nested sources, currently only Export sources can have nested sources
	const nested = isExportSource(value) && value.props.parameterValues;

	// track nested source keys for this export source
	const nestedSourceKeys = new Map<string, string>();

	// recursively add nested sources
	if (nested) {
		// For export sources, nested parameters should use the export's sessionId if specified
		const nestedNamespace = isExportSource(value) && value.props.sessionId
			? value.props.sessionId
			: namespace;
			
		for (const [childKey, child] of Object.entries(nested)) {
			// check if the child is a source
			if (
				typeof child === "object" &&
				child !== null &&
				isParameterSource(child)
			) {
				// track this nested source
				const childSourceKey = createSourceKey(child);
				nestedSourceKeys.set(childKey, childSourceKey);
			}

			addSourceToFlatMap(
				{id: childKey, value: child, namespace: nestedNamespace},
				map,
				resolving,
				resolved
			);
		}
	}

	// add to map if not already present
	const key = createSourceKey(value);
	if (!map.has(key)) {
		map.set(key, {
			index: map.size,
			source: value,
			id: id,
			namespace: namespace,
			nestedSourceKeys:
				nestedSourceKeys.size > 0 ? nestedSourceKeys : undefined,
		});
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
}): {
	values: string[] | undefined;
	isResolving: boolean;
} {
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

		return {sources, topLevelParameterToIndex, flat};
	}, [parameterValues, namespace]);

	// Multi-pass resolution: iteratively resolve sources until all are resolved or no progress is made
	// This handles n-level nested sources
	const [resolutionState, setResolutionState] = useState<
		| {
				currentPass: number;
				resolvedMap: Map<string, unknown>;
				pendingSources: {
					source: IAppBuilderParameterValueSourceDefinition;
					id: string;
					namespace?: string;
					entryIndex: number;
				}[];
		  }
		| undefined
	>(undefined);

	// Initialize resolution state when sourceData changes
	useEffect(() => {
		if (!sourceData) {
			setResolutionState(undefined);
			return;
		}

		const flatArray = Array.from(sourceData.flat.values());
		const pendingSources = flatArray.map((entry, index) => ({
			source: entry.source,
			id: entry.id,
			namespace: entry.namespace,
			entryIndex: index,
		}));

		setResolutionState({
			currentPass: 0,
			resolvedMap: new Map(),
			pendingSources,
		});
	}, [sourceData]);

	// Determine which sources can be resolved in the current pass
	const currentPassSources = useMemo(() => {
		if (!sourceData || !resolutionState) return undefined;

		const flatArray = Array.from(sourceData.flat.values());
		const sources: {
			source: IAppBuilderParameterValueSourceDefinition;
			id: string;
			namespace?: string;
			entryIndex: number;
		}[] = [];

		// Find sources whose all dependencies are resolved
		for (const pending of resolutionState.pendingSources) {
			const entry = flatArray[pending.entryIndex];
			let canResolve = true;

			// Check if all nested sources are already resolved
			if (entry.nestedSourceKeys && entry.nestedSourceKeys.size > 0) {
				for (const nestedSourceKey of Array.from(
					entry.nestedSourceKeys.values(),
				)) {
					// Only check if the key exists in the map, not if the value is undefined
					// undefined is a valid resolved value (e.g., screenshot not yet taken)
					if (!resolutionState.resolvedMap.has(nestedSourceKey)) {
						canResolve = false;
						break;
					}
				}

				// If we can resolve, create modified source with resolved nested values
				if (canResolve && isExportSource(entry.source)) {
					const originalParams =
						entry.source.props.parameterValues || {};
					const resolvedParams: {
						[key: string]: IAppBuilderParameterValueDefinition;
					} = {};

					// Replace nested sources with their resolved values
					for (const [paramKey, paramValue] of Object.entries(
						originalParams,
					)) {
						const nestedSourceKey =
							entry.nestedSourceKeys.get(paramKey);
						if (nestedSourceKey) {
							if (resolutionState.resolvedMap.has(nestedSourceKey)) {
								const resolved =
									resolutionState.resolvedMap.get(
										nestedSourceKey,
									);
								resolvedParams[paramKey] =
									resolved as IAppBuilderParameterValueDefinition;
							} else {
								Logger.warn(
									`Could not find resolved value for nested source in export parameter ${paramKey}. NestedSourceKey: ${nestedSourceKey}`,
								);
								resolvedParams[paramKey] = paramValue;
							}
						} else {
							resolvedParams[paramKey] = paramValue;
						}
					}

					// Create modified export source with resolved params
					const modifiedSource: IAppBuilderParameterValueSourceDefinition =
						{
							...entry.source,
							props: {
								...entry.source.props,
								parameterValues: resolvedParams,
							},
						};

					sources.push({
						source: modifiedSource,
						id: pending.id,
						namespace: pending.namespace,
						entryIndex: pending.entryIndex,
					});
				}
			} else {
				// No dependencies, can resolve immediately
				sources.push(pending);
			}
		}

		if (sources.length === 0) {
			// No progress can be made - check if sources are waiting for undefined values
			if (resolutionState.pendingSources.length > 0) {
				// Check if any pending sources are waiting for undefined nested dependencies
				const waitingForUndefined = resolutionState.pendingSources.some((pending) => {
					const entry = flatArray[pending.entryIndex];
					if (entry.nestedSourceKeys && entry.nestedSourceKeys.size > 0) {
						for (const nestedSourceKey of Array.from(
							entry.nestedSourceKeys.values(),
						)) {
							if (resolutionState.resolvedMap.has(nestedSourceKey)) {
								const resolvedValue = resolutionState.resolvedMap.get(nestedSourceKey);
								if (resolvedValue === undefined) {
									return true;
								}
							}
						}
					}
					return false;
				});

				// Only warn if sources are truly stuck (not just waiting for undefined values)
				if (!waitingForUndefined) {
					Logger.warn(
						`Cannot resolve ${resolutionState.pendingSources.length} sources. Possible circular dependency or missing nested sources.`,
					);
				}
			}
			return undefined;
		}

		return sources;
	}, [sourceData, resolutionState]);

	// Resolve sources for current pass
	const currentPassResolved = useParameterValueSources(
		currentPassSources && namespace
			? {
					namespace,
					sources: currentPassSources,
				}
			: undefined,
	);

	// Update resolution state with newly resolved values
	useEffect(() => {
		if (
			!sourceData ||
			!resolutionState ||
			!currentPassSources ||
			!currentPassResolved
		) {
			return;
		}

		const flatArray = Array.from(sourceData.flat.values());
		const newResolvedMap = new Map(resolutionState.resolvedMap);
		const newPending = [...resolutionState.pendingSources];

		// Add newly resolved values to the map
		for (let i = 0; i < currentPassSources.length; i++) {
			const source = currentPassSources[i];
			const entry = flatArray[source.entryIndex];
			const key = createSourceKey(entry.source);
			newResolvedMap.set(key, currentPassResolved[i]);

			// Remove from pending
			const pendingIndex = newPending.findIndex(
				(p) => p.entryIndex === source.entryIndex,
			);
			if (pendingIndex >= 0) {
				newPending.splice(pendingIndex, 1);
			}
		}

		// Check if we're done or need another pass
		if (newPending.length === 0) {
			// All sources resolved
			setResolutionState({
				currentPass: resolutionState.currentPass + 1,
				resolvedMap: newResolvedMap,
				pendingSources: [],
			});
		} else {
			// More sources to resolve, trigger next pass
			setResolutionState({
				currentPass: resolutionState.currentPass + 1,
				resolvedMap: newResolvedMap,
				pendingSources: newPending,
			});
		}
	}, [sourceData, currentPassSources, currentPassResolved]);

	// Extract final resolved sources in correct order
	const resolvedSources = useMemo(() => {
		if (!sourceData || !resolutionState) return undefined;
		if (resolutionState.pendingSources.length > 0) return undefined;

		const flatArray = Array.from(sourceData.flat.values());
		const result: unknown[] = [];

		for (const entry of flatArray) {
			const key = createSourceKey(entry.source);
			const resolved = resolutionState.resolvedMap.get(key);
			result.push(resolved);
		}

		return result;
	}, [sourceData, resolutionState]);

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

				// Convert the resolved value to string, using empty string if undefined
				result.push(resolvedValue !== undefined ? resolvedValue + "" : "");
			} else {
				result.push(value + "");
			}
		}

		return result;
	}, [parameterValues, resolvedSources, sourceData]);

	// Determine if we're still resolving
	// We're resolving if:
	// 1. We have sources to resolve, AND
	// 2. There are pending sources, OR the resolved parameters are not ready yet
	const isResolving = useMemo(() => {
		if (!sourceData) return false;
		if (!resolutionState) return true; // Still initializing
		if (resolutionState.pendingSources.length > 0) return true; // Still resolving
		if (sourceData.flat.size > 0 && !resolvedParameters) return true; // Sources exist but not resolved yet
		return false;
	}, [sourceData, resolutionState, resolvedParameters]);

	return {
		values: resolvedParameters,
		isResolving,
	};
}
