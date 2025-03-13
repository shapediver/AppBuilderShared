import {IEventTracking} from "@AppBuilderShared/types/eventTracking";
import {
	ISessionApi,
	ITreeNode,
	SessionCreationDefinition,
} from "@shapediver/viewer.session";

/**
 * A callback that is executed whenever a node is to be replaced due to an update of the content.
 * Provides the new scene tree node and the old one, so that data can be carried over.
 * If the callback is a promise it will be awaited in the execution chain.
 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/ISessionApi.html#updateCallback
 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/IOutputApi.html#updateCallback
 */
export type UpdateCallbackType = (
	newNode?: ITreeNode,
	oldNode?: ITreeNode,
) => Promise<void> | void;

/**
 * Redeclaration of SessionCreationDefinition to always have an id.
 */
export interface SessionCreateDto extends SessionCreationDefinition {
	id: string;
}

export interface IShapeDiverStoreSessions {
	[sessionId: string]: ISessionApi;
}

/**
 * Callbacks related to IShapeDiverStore.
 */
export type IShapeDiverStoreSessionCallbacks = Pick<IEventTracking, "onError">;

/**
 * Interface for the store of viewer-related data.
 */
export interface IShapeDiverStoreSession {
	/**
	 * Sessions currently known by the store.
	 */
	sessions: IShapeDiverStoreSessions;

	/**
	 * Create a session and add it to the store.
	 * @param dto
	 * @param callbacks
	 * @returns
	 */
	createSession: (
		dto: SessionCreateDto,
		callbacks?: IShapeDiverStoreSessionCallbacks,
	) => Promise<ISessionApi | undefined>;

	/**
	 * Close a session and remove it from the store.
	 */
	closeSession: (
		sessionId: string,
		callbacks?: IShapeDiverStoreSessionCallbacks,
	) => Promise<void>;

	/**
	 * Synchronize the sessions with the given dtos, create and close sessions as required.
	 * @param sessionsDtos
	 * @param callbacks
	 * @returns
	 */
	syncSessions: (
		sessionDtos: SessionCreateDto[],
		callbacks?: IShapeDiverStoreSessionCallbacks,
	) => Promise<(ISessionApi | undefined)[]>;

	/**
	 * The session update callbacks.
	 * Stores the callbacks for each session id with the corresponding callback id to be able to remove them.
	 *
	 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/ISessionApi.html#updateCallback
	 */
	sessionUpdateCallbacks: {
		// session id
		[key: string]: {
			// callback id
			[key: string]: UpdateCallbackType;
		};
	};

	/**
	 * Add a session update callback.
	 *
	 * The callback is executed whenever the session is updated.
	 * It will also be executed when it is added or removed as well.
	 *
	 * @param sessionId The id of the session to add the callback to.
	 * @param updateCallback The callback to add.
	 * @returns A function to remove the callback.
	 */
	addSessionUpdateCallback: (
		sessionId: string,
		updateCallback: UpdateCallbackType,
	) => () => void;

	/**
	 * The output update callbacks.
	 * Stores the callbacks for each session id and output id with the corresponding callback id to be able to remove them.
	 *
	 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/IOutputApi.html#updateCallback
	 */
	outputUpdateCallbacks: {
		// session id
		[key: string]: {
			// output id
			[key: string]: {
				// callback id
				[key: string]: UpdateCallbackType;
			};
		};
	};

	/**
	 * Add an output update callback.
	 *
	 * The callback is executed whenever the output is updated.
	 * It will also be executed when it is added or removed as well.
	 *
	 * @param sessionId The id of the session to add the callback to.
	 * @param outputId The id of the output to add the callback to.
	 * @param updateCallback The callback to add.
	 * @returns A function to remove the callback.
	 */
	addOutputUpdateCallback: (
		sessionId: string,
		outputId: string,
		updateCallback: UpdateCallbackType,
	) => () => void;
}
