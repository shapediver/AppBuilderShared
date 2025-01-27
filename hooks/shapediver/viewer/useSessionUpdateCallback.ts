import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {ISessionApi, ITreeNode} from "@shapediver/viewer.session";
import {useEffect} from "react";

// #region Type aliases (4)

export type ISessionUpdateCallbackHandlerResult = {
	sessionApi: ISessionApi | undefined;
};
export type ISessionUpdateCallbackHandlerState = {
	sessionId: string;
	callbackId: string;
	updateCallback: SessionUpdateCallbackType;
	setData?: React.Dispatch<
		React.SetStateAction<ISessionUpdateCallbackHandlerResult>
	>;
};
/**
 * A callback that is executed whenever a session's node is to be replaced due to an update of the session's content.
 * Provides the new scene tree node and the old one, so that data can be carried over.
 * If the callback is a promise it will be awaited in the execution chain.
 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/ISessionApi.html#updateCallback
 */
export type SessionUpdateCallbackType = (
	newNode?: ITreeNode,
	oldNode?: ITreeNode,
) => Promise<void> | void;
/**
 * Session update callbacks by session id and callback id.
 */
type SessionUpdateCallbacks = {
	[key: string]: {[key: string]: SessionUpdateCallbackType};
};

// #endregion Type aliases (4)

// #region Functions (1)

/**
 * Hook providing access to session by id, and allowing to register a callback for updates.
 * Note that the callback will NOT be called when registering or deregistering it.
 *
 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/ISessionApi.html
 *
 * Makes use of {@link useSession}.
 *
 * @param sessionId
 * @returns
 */
export function useSessionUpdateCallback(
	sessionId: string,
	callbackId: string,
	updateCallback: SessionUpdateCallbackType,
): {
	/**
	 * API of the session
	 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/ISessionApi.html
	 */
	sessionApi: ISessionApi | undefined;
} {
	const sessionApi = useShapeDiverStoreSession(
		(store) => store.sessions[sessionId],
	);

	// manage callbacks
	useEffect(() => {
		if (!updateCallbacks[sessionId]) {
			updateCallbacks[sessionId] = {};
		}
		updateCallbacks[sessionId][callbackId] = updateCallback;

		// call it once to set the initial state
		updateCallback(sessionApi?.node);

		return () => {
			delete updateCallbacks[sessionId][callbackId];
		};
	}, [sessionApi, sessionId, callbackId, updateCallback]);

	// register the single callback which will call all registered callbacks
	useEffect(() => {
		if (sessionApi) {
			sessionApi.updateCallback = async (
				newNode?: ITreeNode,
				oldNode?: ITreeNode,
			) => {
				await Promise.all(
					Object.values(updateCallbacks[sessionId]).map((cb) =>
						cb(newNode, oldNode),
					),
				);
			};
		}

		return () => {
			if (sessionApi) {
				sessionApi.updateCallback = null;
			}
		};
	}, [sessionApi]);

	return {
		sessionApi,
	};
}

// #endregion Functions (1)

// #region Variables (2)

export const SessionUpdateCallbackHandler: React.FC<
	ISessionUpdateCallbackHandlerState
> = ({
	sessionId,
	callbackId,
	updateCallback,
	setData,
}: ISessionUpdateCallbackHandlerState) => {
	const {sessionApi} = useSessionUpdateCallback(
		sessionId,
		callbackId,
		updateCallback,
	);

	useEffect(() => {
		if (setData) {
			setData({sessionApi});
		}
	}, [sessionApi]);

	return null;
};
/**
 * Callbacks to use for ISessionApi.updateCallback
 */
const updateCallbacks: SessionUpdateCallbacks = {};

// #endregion Variables (2)
