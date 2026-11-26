import type {ITreeNode} from "@shapediver/viewer.session";

/**
 * A scene node matching a name filter, with the name used by interaction parameters.
 *
 * Kept apart from `findNodesByNameFilter` so viewer-free modules (the selection
 * action registry) can use it without importing `@shapediver/viewer.features.interaction`.
 */
export type NamedNode = {node: ITreeNode; name: string};
