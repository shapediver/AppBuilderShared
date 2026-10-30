import {getPatterns} from "@AppBuilderLib/entities/parameter/model/interaction/useCreateNameFilterPattern";
import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";
import {useShapeDiverStoreInstances} from "@AppBuilderLib/features/appbuilder/model/useShapeDiverStoreInstances";
import {
	gatherNodesForPattern,
	NodeNameFilterPattern,
} from "@shapediver/viewer.features.interaction";
import {ITreeNode} from "@shapediver/viewer.session";

/** A scene node matching a name filter, with the name used by interaction parameters. */
export type NamedNode = {node: ITreeNode; name: string};

/**
 * Collect nodes (and their interaction names) under `root` that match the
 * given name-filter patterns.
 * Empty patterns select the root itself (same behavior as the find-nodes hooks).
 */
function collectNamedNodesForPatternRoot(
	root: ITreeNode,
	displayName: string,
	patterns: NodeNameFilterPattern[],
	strictNaming?: boolean,
): NamedNode[] {
	const availableNodes: {
		[nodeId: string]: NamedNode;
	} = {};

	for (const pattern of patterns) {
		if (pattern.length === 0) {
			availableNodes[root.id] = {
				node: root,
				name: displayName,
			};
		} else {
			for (const child of root.children) {
				gatherNodesForPattern(
					child,
					pattern,
					displayName,
					availableNodes,
					0,
					strictNaming,
				);
			}
		}
	}

	return Object.values(availableNodes);
}

/**
 * Collect nodes under `root` that match the given name-filter patterns.
 * Empty patterns select the root itself (same behavior as the find-nodes hooks).
 */
export function collectNodesForPatternRoot(
	root: ITreeNode,
	displayName: string,
	patterns: NodeNameFilterPattern[],
	strictNaming?: boolean,
): ITreeNode[] {
	return collectNamedNodesForPatternRoot(
		root,
		displayName,
		patterns,
		strictNaming,
	).map((availableNode) => availableNode.node);
}

/**
 * One-shot lookup of the scene nodes (with their interaction names) matching
 * a nameFilter. The corresponding hooks exist to subscribe to output updates
 * over time; this only returns the nodes that are present now.
 */
export function findNamedNodesByNameFilter(
	nameFilter?: string[],
	strictNaming?: boolean,
): NamedNode[] {
	if (!nameFilter?.length) return [];

	const sessions = useShapeDiverStoreSession.getState().sessions;
	const instances = useShapeDiverStoreInstances.getState().instances;
	const {outputPatterns, instancePatterns} = getPatterns(
		sessions,
		instances,
		nameFilter,
	);
	const nodes: NamedNode[] = [];

	if (outputPatterns) {
		for (const [sessionId, byOutput] of Object.entries(outputPatterns)) {
			const session = sessions[sessionId];
			if (!session) continue;
			for (const [outputId, patterns] of Object.entries(byOutput)) {
				const output = session.outputs[outputId];
				const node = output?.node;
				if (!node) continue;
				nodes.push(
					...collectNamedNodesForPatternRoot(
						node,
						output.name,
						patterns,
						strictNaming,
					),
				);
			}
		}
	}

	if (instancePatterns) {
		for (const [instanceId, patterns] of Object.entries(instancePatterns)) {
			const instance = instances[instanceId];
			if (!instance) continue;
			nodes.push(
				...collectNamedNodesForPatternRoot(
					instance,
					instance.name,
					patterns,
					strictNaming,
				),
			);
		}
	}

	return nodes;
}

/**
 * One-shot lookup of scene nodes for a camera `zoomTo` nameFilter.
 * The corresponding hooks exist to subscribe to output updates over time;
 * executeActions only needs the nodes that are present now.
 */
export function findNodesByNameFilter(nameFilter?: string[]): ITreeNode[] {
	return findNamedNodesByNameFilter(nameFilter).map(({node}) => node);
}
