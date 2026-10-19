import {getPatterns} from "@AppBuilderLib/entities/parameter/model/interaction/useCreateNameFilterPattern";
import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";
import {useShapeDiverStoreInstances} from "@AppBuilderLib/features/appbuilder/model/useShapeDiverStoreInstances";
import {
	gatherNodesForPattern,
	NodeNameFilterPattern,
} from "@shapediver/viewer.features.interaction";
import {ITreeNode} from "@shapediver/viewer.session";

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
	const availableNodes: {
		[nodeId: string]: {node: ITreeNode; name: string};
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

	return Object.values(availableNodes).map(
		(availableNode) => availableNode.node,
	);
}

/**
 * One-shot lookup of scene nodes for a camera `zoomTo` nameFilter.
 * The corresponding hooks exist to subscribe to output updates over time;
 * executeActions only needs the nodes that are present now.
 */
export function findNodesByNameFilter(nameFilter?: string[]): ITreeNode[] {
	if (!nameFilter?.length) return [];

	const sessions = useShapeDiverStoreSession.getState().sessions;
	const instances = useShapeDiverStoreInstances.getState().instances;
	const {outputPatterns, instancePatterns} = getPatterns(
		sessions,
		instances,
		nameFilter,
	);
	const nodes: ITreeNode[] = [];

	if (outputPatterns) {
		for (const [sessionId, byOutput] of Object.entries(outputPatterns)) {
			const session = sessions[sessionId];
			if (!session) continue;
			for (const [outputId, patterns] of Object.entries(byOutput)) {
				const output = session.outputs[outputId];
				const node = output?.node;
				if (!node) continue;
				nodes.push(
					...collectNodesForPatternRoot(node, output.name, patterns),
				);
			}
		}
	}

	if (instancePatterns) {
		for (const [instanceId, patterns] of Object.entries(instancePatterns)) {
			const instance = instances[instanceId];
			if (!instance) continue;
			nodes.push(
				...collectNodesForPatternRoot(
					instance,
					instance.name,
					patterns,
				),
			);
		}
	}

	return nodes;
}
