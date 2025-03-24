import {ITreeNode} from "@shapediver/viewer.session";

/**
 * Interface for the store of the session instances.
 */
export interface IShapeDiverStoreInstances {
	/**
	 * Instances currently known by the store.
	 * The key is the instance ID.
	 * The node contains children equal to the number of transformations.
	 */
	instances: {
		[instanceId: string]: ITreeNode;
	};

	/**
	 * Add instances to the store.
	 * The node contains children equal to the number of transformations.
	 *
	 * @param instanceId
	 * @param instance
	 */
	addInstance: (instanceId: string, instance: ITreeNode) => void;

	/**
	 * Remove instances from the store.
	 *
	 * @param instanceId
	 */
	removeInstance: (instanceId: string) => void;
}
