import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";
import {useShapeDiverStoreInstances} from "@AppBuilderLib/features/appbuilder/model/useShapeDiverStoreInstances";
import {matchNodesWithPatterns} from "@shapediver/viewer.features.interaction";
import type {ITreeNode} from "@shapediver/viewer.session";
import {getPatterns} from "./useCreateNameFilterPattern";

/**
 * Match name filters (output name and hierarchical node names, separated by
 * dots, `*` as wildcard) against the given nodes, the same way the name
 * filter of an interaction parameter matches nodes.
 *
 * @returns The names of the matching nodes.
 */
export function matchSelectionNames(
	nameFilter: string[],
	nodes: ITreeNode[],
): Set<string> {
	if (nameFilter.length === 0 || nodes.length === 0) return new Set();

	const {outputPatterns, instancePatterns} = getPatterns(
		useShapeDiverStoreSession.getState().sessions,
		useShapeDiverStoreInstances.getState().instances,
		nameFilter,
	);
	const names: string[] = [];
	for (const sessionId in outputPatterns) {
		names.push(
			...matchNodesWithPatterns(outputPatterns[sessionId], nodes, true),
		);
	}
	if (instancePatterns)
		names.push(...matchNodesWithPatterns(instancePatterns, nodes, true));

	return new Set(names);
}
