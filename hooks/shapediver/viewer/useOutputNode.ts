import {useOutput} from "@AppBuilderShared/hooks/shapediver/viewer/useOutput";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {IOutputApi, ITreeNode} from "@shapediver/viewer.session";
import {useCallback, useEffect, useState} from "react";

/**
 * Hook providing access to outputs by id,
 * allowing to register a callback for updates of the output,
 * and providing the scene tree node of the output.
 * Note that the callback will also be called when registering or deregistering it.
 * This happens if the callback changes, or the output changes.
 *   * deregistration: The call will not include a new node
 *   * registration: The call will not include an old node
 *
 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/IOutputApi.html
 *
 * Makes use of {@link useOutput}.
 *
 * @param sessionId
 * @param outputId
 * @param callback Optional callback which will be called on update of the output node.
 *                 The callback will be called with the new and old node.
 * 			   	   The very first call will not include an old node.
 *                 The very last call will not include a new node.
 * @returns
 */
export function useOutputNode(
	sessionId: string,
	outputId: string,
): {
	/**
	 * API of the output
	 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/IOutputApi.html
	 */
	outputApi: IOutputApi | undefined;
	/**
	 * Scene tree node of the output
	 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/IOutputApi.html#node
	 */
	outputNode: ITreeNode | undefined;
} {
	const {outputApi} = useOutput(sessionId, outputId);

	const [node, setNode] = useState<ITreeNode | undefined>(outputApi?.node);
	const {addOutputUpdateCallback} = useShapeDiverStoreSession();

	// combine the optional user-defined callback with setting the current node
	const cb = useCallback((node?: ITreeNode) => {
		setNode(node);
	}, []);

	// use an effect to set the initial node
	useEffect(() => {
		const removeOutputUpdateCallback = addOutputUpdateCallback(
			sessionId,
			outputId,
			cb,
		);

		return removeOutputUpdateCallback;
	}, [outputApi, cb]);

	return {
		outputApi,
		outputNode: node,
	};
}
