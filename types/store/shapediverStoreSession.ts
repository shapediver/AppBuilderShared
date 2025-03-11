import {IEventTracking} from "@AppBuilderShared/types/eventTracking";
import {
	ISessionApi,
	SessionCreationDefinition,
} from "@shapediver/viewer.session";

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
}
