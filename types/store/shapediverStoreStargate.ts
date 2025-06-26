import {
	ISdStargateClientModel,
	ISdStargateGetSupportedDataReplyDto,
	ISdStargateStatusReplyDto,
	type ISdStargateSdk,
} from "@shapediver/sdk.stargate-sdk-v1";
import {NetworkStatus} from "../shapediver/stargate";

/**
 * Reference to the Stargate SDK.
 */
export interface IStargateClientRef {
	/**
	 * Stargate client.
	 */
	sdk: ISdStargateSdk;
}

/**
 * Interface of the store for the ShapeDiver Stargate service.
 */
export interface IShapeDiverStoreStargate {
	/**
	 * Indicates whether the Stargate service is enabled.
	 */
	isStargateEnabled: boolean;

	/**
	 * Reference to the Stargate SDK.
	 * This is undefined if the application is not running on the platform or if
	 * authenticate has not been called or has not succeeded.
	 */
	sdkRef: IStargateClientRef | undefined;

	/**
	 * Create a Stargate SDK and register with the Stargate service.
	 * In case the application is not running on the platform, this function returns undefined.
	 * @param redirect Redirect for authentication in case using a refresh token did not work. Defaults to true.
	 * @param forceReconnect Force re-authentication, do not use cached token. Defaults to false.
	 * @returns The registered Stargate SDK.
	 */
	authenticate: (
		redirect?: boolean,
		forceReconnect?: boolean,
	) => Promise<IStargateClientRef | undefined>;

	/**
	 * Current network status of the Stargate connection.
	 */
	networkStatus: NetworkStatus;

	/**
	 * The currently selected client.
	 */
	selectedClient: ISdStargateClientModel | undefined;

	/**
	 * Select a client to use for Stargate operations.
	 * If the client is undefined, the currently selected client is cleared.
	 * @param client
	 * @returns
	 */
	selectClient: (client: ISdStargateClientModel | undefined) => Promise<void>;

	/**
	 * Get the status of the given client (if any), or the currently selected client (if any).
	 * Returns undefined if no client is selected or the SDK is not initialized.
	 * @param client Optional client to get the status for. If not provided, the currently selected client is used.
	 */
	getClientStatus: (
		client?: ISdStargateClientModel,
	) => Promise<ISdStargateStatusReplyDto | undefined>;

	/**
	 * Get a list of all available clients.
	 * @param flush
	 * @returns
	 */
	getAvailableClients: (flush?: boolean) => Promise<ISdStargateClientModel[]>;

	/**
	 * Get information about the data types supported by the currently selected client.
	 * Returns undefined if no client is selected or the SDK is not initialized.
	 * @param flush
	 * @returns
	 */
	getSupportedData: (
		flush?: boolean,
	) => Promise<ISdStargateGetSupportedDataReplyDto | undefined>;
}

/** Type of cache. */
export enum StargateCacheKeyEnum {
	Authenticate = "authenticate",
	AvailableClients = "availableClients",
	SupportedData = "supportedData",
}

/**
 * Extended store for Stargate interaction, including functionality used by the store implementation
 */
export interface IShapeDiverStoreStargateExtended
	extends IShapeDiverStoreStargate {
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
		cacheType: StargateCacheKeyEnum,
		flush: boolean,
		initializer: () => Promise<T>,
	) => Promise<T>;
}
