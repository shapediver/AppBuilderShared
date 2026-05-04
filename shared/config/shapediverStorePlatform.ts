import {
	SdPlatformResponseModelPublic,
	SdPlatformResponseUserSelf,
	SdPlatformSdk,
} from "@shapediver/sdk.platform-api-sdk-v1";

/**
 * Reference to the authenticated platform client.
 */
export interface IPlatformClientRef {
	/**
	 * Token for the platform client.
	 * May be undefined in case the client is not authenticated (anonymous user).
	 */
	jwtToken: string | undefined;
	/** Base URL of the platform */
	platformUrl: string;
	/**
	 * Platform client.
	 * May be authenticated or not, @see {@link jwtToken}.
	 */
	client: SdPlatformSdk;
}

/**
 * Interface of the store for basic platform interaction (authentication, user information).
 */
export interface IShapeDiverStorePlatform {
	/**
	 * Authenticate the platform client.
	 * In case the application is not running on the platform, this function returns undefined.
	 * @param redirect Redirect for authentication in case using a refresh token did not work. Defaults to true.
	 * @param forceReAuthenticate Force re-authentication, do not use cached token. Defaults to false.
	 * @returns The platform client, which may be unauthenticated if redirect is false, @see {@link IPlatformClientRef.jwtToken}.
	 */
	authenticate: (
		redirect?: boolean,
		forceReAuthenticate?: boolean,
	) => Promise<IPlatformClientRef | undefined>;

	/**
	 * Wrapper for executing functions requiring an authenticated platform client.
	 * Tries to re-authenticate in case the current authentication is invalid.
	 * @param cb The callback to execute with an authenticated platform client.
	 * @param redirect Redirect for authentication in case re-authentication is required. Defaults to true.
	 * @returns The result of the callback.
	 */
	authWrapper: <T>(
		cb: (clientRef: IPlatformClientRef) => Promise<T>,
		redirect?: boolean,
	) => Promise<T>;

	/**
	 * Information about the current user.
	 */
	user: SdPlatformResponseUserSelf | undefined;

	/**
	 * Load information about the current user.
	 * @param forceRefresh Force refreshing the user information, do not use cached data. Defaults to false.
	 */
	getUser: (
		forceRefresh?: boolean,
	) => Promise<SdPlatformResponseUserSelf | undefined>;

	/**
	 * If a "slug" query string parameter is present, the model corresponding to it (if any).
	 */
	currentModel: SdPlatformResponseModelPublic | undefined;

	/**
	 * Set the current model.
	 * @param model
	 */
	setCurrentModel: (model: SdPlatformResponseModelPublic | undefined) => void;

	/**
	 * Map of models indexed by session id, for all sessions for which a platform model is available.
	 * This is populated when sessions are opened on the platform.
	 */
	models: {[sessionId: string]: SdPlatformResponseModelPublic};

	/**
	 * Store (or remove) the platform model associated with the given session id.
	 * @param sessionId The session id.
	 * @param model The model to store, or undefined to remove.
	 */
	setModelForSession: (
		sessionId: string,
		model: SdPlatformResponseModelPublic | undefined,
	) => void;

	/**
	 * Get the platform model for the given session id.
	 * Falls back to currentModel if no model is found for the session.
	 * @param sessionId The session id to look up. If undefined, falls back to currentModel.
	 */
	getModelForSession: (
		sessionId?: string,
	) => SdPlatformResponseModelPublic | undefined;
}

/** Type of cache. */
export enum PlatformCacheKeyEnum {
	Authenticate = "authenticate",
	GetUser = "getUser",
}

/**
 * Extended store for basic platform interaction, including functionality used by the store implementation
 */
export interface IShapeDiverStorePlatformExtended extends IShapeDiverStorePlatform {
	/** Cache for diverse stuff */
	genericCache: {[key: string]: any};

	/**
	 * Cache a promise in the store.
	 * @param cacheType type of cache
	 * @param flush force flushing of the cache
	 * @param initializer
	 * @returns
	 */
	cachePromise: <T>(
		cacheType: PlatformCacheKeyEnum,
		flush: boolean,
		initializer: () => Promise<T>,
	) => Promise<T>;
}
