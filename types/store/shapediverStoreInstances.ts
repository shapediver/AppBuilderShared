import {ITreeNode} from "@shapediver/viewer.session";

/**
 * Interface for the store of the instances.
 */
export interface IShapeDiverStoreInstances {
	/**
	 * Transformed instances currently known by the store.
	 * The key is the instance ID.
	 * The node contains children equal to the number of transformations.
	 */
	instances: {
		[instanceId: string]: ITreeNode;
	};

	/**
	 * The customization results (as tree nodes) currently known by the store.
	 * The key is the session id and the parameterValues as stringified JSON.
	 */
	customizationResults: {
		[instanceId: string]: ITreeNode;
	};

	/**
	 * Add a customization result to the store.
	 *
	 * @param instanceId
	 * @param result
	 */
	addCustomizationResult: (instanceId: string, instance: ITreeNode) => void;

	/**
	 * Remove a customization result from the store.
	 *
	 * @param instanceId
	 */
	removeCustomizationResult: (instanceId: string) => void;

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
