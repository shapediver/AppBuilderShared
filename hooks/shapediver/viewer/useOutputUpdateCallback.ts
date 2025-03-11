import {useOutput} from "@AppBuilderShared/hooks/shapediver/viewer/useOutput";
import {IOutputApi, ITreeNode} from "@shapediver/viewer.session";
import {useEffect} from "react";

/**
 * A callback that is executed whenever an output's node is to be replaced due to an update of the output's content.
 * Provides the new scene tree node and the old one, so that data can be carried over.
 * If the callback is a promise it will be awaited in the execution chain.
 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/IOutputApi.html#updateCallback
 */
export type OutputUpdateCallbackType = (
	newNode?: ITreeNode,
	oldNode?: ITreeNode,
) => Promise<void> | void;

/**
 * Output update callbacks by (session id and output id or name), and callback id.
 */
type OutputUpdateCallbacks = {
	[key: string]: {[key: string]: OutputUpdateCallbackType};
};

/**
 * Callbacks to use for IOutputApi.updateCallback
 */
const updateCallbacks: OutputUpdateCallbacks = {};

/**
 * Hook providing access to outputs by id or name, and allowing to register a callback for updates.
 * Note that the callback will NOT be called when registering or deregistering it.
 *
 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/IOutputApi.html
 *
 * Makes use of {@link useOutput}.
 *
 * @param sessionId
 * @param outputIdOrName
 * @returns
 */
export function useOutputUpdateCallback(
	sessionId: string,
	outputIdOrName: string,
	callbackId: string,
	updateCallback: OutputUpdateCallbackType,
): {
	/**
	 * API of the output
	 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/IOutputApi.html
	 */
	outputApi: IOutputApi | undefined;
} {
	const {outputApi} = useOutput(sessionId, outputIdOrName);

	// manage callbacks
	useEffect(() => {
		const key = `${sessionId}_${outputIdOrName}`;
		if (!updateCallbacks[key]) {
			updateCallbacks[key] = {};
		}
		updateCallbacks[key][callbackId] = updateCallback;

		return () => {
			delete updateCallbacks[key][callbackId];
		};
	}, [sessionId, outputIdOrName, callbackId, updateCallback]);

	// register the single callback which will call all registered callbacks
	useEffect(() => {
		if (outputApi) {
			const key = `${sessionId}_${outputIdOrName}`;
			outputApi.updateCallback = async (
				newNode?: ITreeNode,
				oldNode?: ITreeNode,
			) => {
				await Promise.all(
					Object.values(updateCallbacks[key]).map((cb) =>
						cb(newNode, oldNode),
					),
				);
			};
		}

		return () => {
			if (outputApi) {
				outputApi.updateCallback = null;
			}
		};
	}, [outputApi]);

	return {
		outputApi,
	};
}
