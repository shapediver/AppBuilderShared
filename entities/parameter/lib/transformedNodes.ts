import {mat4, type ReadonlyMat4} from "gl-matrix";

export type TransformedNode = {
	name: string;
	transformation: number[];
	localTransformations?: number[];
};

const IDENTITY = mat4.create();

/**
 * Whether a handle of the transformation tool was moved.
 *
 * The transformation tools emit a matrix change when they are created, with
 * identity local transformations. Only a non-identity local transformation is
 * a change made by the user.
 */
export const hasLocalTransformationDelta = (
	nodes: readonly Pick<TransformedNode, "localTransformations">[],
): boolean =>
	nodes.some(
		(node) =>
			node.localTransformations !== undefined &&
			node.localTransformations.length === 16 &&
			!mat4.equals(node.localTransformations as ReadonlyMat4, IDENTITY),
	);

/**
 * Merge a MATRIX_CHANGED event of a transformation tool into the transformed nodes.
 *
 * The event lists one matrix per scene node. Each node is mapped to its
 * interaction name through `nodeNames` (scene node id to name). A single node
 * with a single selected name falls back to that name.
 *
 * @returns A new array. Entries of `current` are not mutated.
 */
export const mergeTransformationEvent = (
	current: readonly TransformedNode[],
	event: {
		nodes: readonly {id: string}[];
		transformations: readonly ArrayLike<number>[];
		localTransformations: readonly ArrayLike<number>[];
	},
	nodeNames: ReadonlyMap<string, string>,
	selectedNodeNames: readonly string[],
): TransformedNode[] => {
	const result = [...current];
	event.nodes.forEach((node, i) => {
		const name =
			nodeNames.get(node.id) ??
			(event.nodes.length === 1 && selectedNodeNames.length === 1
				? selectedNodeNames[0]
				: undefined);
		if (name === undefined || !selectedNodeNames.includes(name)) return;
		const entry: TransformedNode = {
			name,
			transformation: Array.from(event.transformations[i]),
			localTransformations: Array.from(event.localTransformations[i]),
		};
		const index = result.findIndex((tn) => tn.name === name);
		if (index !== -1) result[index] = entry;
		else result.push(entry);
	});
	return result;
};
