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
	 * Reference to the platform client.
	 * The client may be authenticated or not, @see {@link IPlatformClientRef.jwtToken}.
	 */
	clientRef: IPlatformClientRef | undefined;

	/**
	 * Authenticate the platform client.
	 * In case the application is not running on the platform, this function returns undefined.
	 * @param redirect Redirect for authentication in case using a refresh token did not work. Defaults to true.
	 * @param forceReAuthenticate Force re-authentication, do not use cached token. Defaults to false.
	 * @returns The authenticated platform client.
	 */
	authenticate: (
		redirect?: boolean,
		forceReAuthenticate?: boolean,
	) => Promise<IPlatformClientRef | undefined>;

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
}

/** Type of cache. */
export enum PlatformCacheKeyEnum {
	Authenticate = "authenticate",
	GetUser = "getUser",
}

/**
 * Extended store for basic platform interaction, including functionality used by the store implementation
 */
export interface IShapeDiverStorePlatformExtended
	extends IShapeDiverStorePlatform {
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
