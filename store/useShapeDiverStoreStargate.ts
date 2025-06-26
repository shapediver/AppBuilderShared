import {devtoolsSettings} from "@AppBuilderShared/store/storeSettings";
import {NetworkStatus} from "@AppBuilderShared/types/shapediver/stargate";
import {
	IShapeDiverStoreStargateExtended,
	StargateCacheKeyEnum,
} from "@AppBuilderShared/types/store/shapediverStoreStargate";
import {shouldUsePlatform} from "@AppBuilderShared/utils/platform/environment";
import {
	createSdk,
	ISdStargateClientModel,
	SdStargateGetSupportedDataCommand,
	SdStargateStatusCommand,
} from "@shapediver/sdk.stargate-sdk-v1";
import {create} from "zustand";
import {devtools} from "zustand/middleware";
import {useShapeDiverStorePlatform} from "./useShapeDiverStorePlatform";

let pingTimeout: NodeJS.Timeout | null = null;
const PING_INTERVAL_MS = 1000 * 30; // 30 seconds

/**
 * Stop pinging the selected client
 */
function pingConnectionClose() {
	if (pingTimeout) {
		clearInterval(pingTimeout);
		pingTimeout = null;
	}
}

interface IShapeDiverStoreStargateInternal
	extends IShapeDiverStoreStargateExtended {
	/** Shortcut for setting networkStatus. Avoid this when doing multiple state updates in a row. */
	setNetworkStatus: (status: NetworkStatus) => void;
	/** Shortcut for setting selectedClient. Avoid this when doing multiple state updates in a row. */
	setSelectedClient: (client: ISdStargateClientModel | undefined) => void;
	/** Handler used if the SDK tells us about a disconnection from the Stargate service. */
	handleDisconnect: (msg: string) => void;
	/** Start a regular "ping" connection with the selected client. */
	pingConnectionStart: () => void;
}

/**
 * Store data related to the ShapeDiver Stargate service.
 * @see {@link IShapeDiverStoreStargate}
 */
export const useShapeDiverStoreStargate =
	create<IShapeDiverStoreStargateInternal>()(
		devtools(
			(set, get) => ({
				isStargateEnabled: shouldUsePlatform(),

				sdkRef: undefined,

				genericCache: {},

				networkStatus: NetworkStatus.none,

				selectedClient: undefined,

				handleDisconnect: (/* msg: string */) => {
					pingConnectionClose();
					set(
						{
							networkStatus: NetworkStatus.none,
							selectedClient: undefined,
							// Clear the cache completely on disconnect
							genericCache: {},
						},
						false,
						"handleDisconnect",
					);
				},

				authenticate: async (
					redirect: boolean = true,
					forceReconnect?: boolean,
				) => {
					if (!shouldUsePlatform()) return;

					const {sdkRef, cachePromise, handleDisconnect} = get();

					if (!forceReconnect && sdkRef) return sdkRef;

					return cachePromise(
						StargateCacheKeyEnum.Authenticate,
						forceReconnect ?? false,
						async () => {
							// TODO clarify whether we should do some cleanup in case
							// there is a previous clientRef (cleanup the websocket connection or similar)

							const {authenticate} =
								useShapeDiverStorePlatform.getState();
							const platformClientRef = await authenticate(
								redirect,
								forceReconnect,
							);
							if (
								!platformClientRef ||
								!platformClientRef.jwtToken
							)
								return;

							const {
								data: {endpoint},
							} =
								await platformClientRef.client.stargate.getConfig();

							const url =
								typeof endpoint === "string"
									? endpoint
									: Object.values(endpoint)[0];

							const sdk = await createSdk()
								.setBaseUrl(url)
								.setServerCommandHandler((payload: unknown) => {
									// In practice, this should never be called
									console.log(
										"Stargate command handler payload received",
										payload,
									);
								})
								.setConnectionErrorHandler((msg: string) => {
									// TODO: implement a proper error handler
									console.error("Stargate errHandler", msg);
								})
								.setDisconnectHandler(handleDisconnect)
								.build();

							await sdk.register(
								platformClientRef.jwtToken,
								"React App Builder",
								"1.0.0",
								navigator.platform || "",
								window.location.hostname,
								"",
							);

							const newSdkRef = {
								...sdkRef,
								sdk,
							};

							set(
								{
									sdkRef: newSdkRef,
									networkStatus: NetworkStatus.disconnected,
								},
								false,
								"authenticate",
							);

							return newSdkRef;
						},
					);
				},

				getClientStatus: async (_client?: ISdStargateClientModel) => {
					const {sdkRef, selectedClient} = get();
					const client = _client || selectedClient;
					if (!sdkRef || !client) return undefined;
					const {sdk} = sdkRef;
					const command = new SdStargateStatusCommand(sdk);
					const result = await command.send({}, [client]);
					return result.length > 0 ? result[0] : undefined;
				},

				getAvailableClients: async (flush?: boolean) => {
					const {authenticate, cachePromise} = get();
					const sdkRef = await authenticate();
					if (!sdkRef) return [];
					return cachePromise(
						StargateCacheKeyEnum.AvailableClients,
						flush ?? false,
						async () => sdkRef.sdk.listFrontendClients(),
					);
				},

				setNetworkStatus: (status: NetworkStatus) => {
					set({networkStatus: status}, false, "setNetworkStatus");
				},

				setSelectedClient: (
					client: ISdStargateClientModel | undefined,
				) => {
					set({selectedClient: client}, false, "setSelectedClient");
				},

				pingConnectionStart: () => {
					const {getClientStatus} = get();
					pingConnectionClose();
					pingTimeout = setInterval(async () => {
						try {
							const status = await getClientStatus();
							if (!status) {
								console.log(
									"Status check failed, disconnecting",
								);
								pingConnectionClose();
								set(
									{
										networkStatus:
											NetworkStatus.disconnected,
										selectedClient: undefined,
									},
									false,
									"pingConnection - status check failed",
								);
							}
						} catch (error) {
							console.log("Status check failed:", error);
							pingConnectionClose();
							set(
								{
									networkStatus: NetworkStatus.disconnected,
									selectedClient: undefined,
								},
								false,
								"pingConnection - status check error",
							);
						}
					}, PING_INTERVAL_MS);
				},

				selectClient: async (
					client: ISdStargateClientModel | undefined,
				) => {
					const {
						selectedClient,
						setNetworkStatus,
						getClientStatus,
						pingConnectionStart,
					} = get();

					if (!client) {
						if (!selectedClient) return;
						pingConnectionClose();
						set(
							{
								networkStatus: NetworkStatus.disconnected,
								selectedClient: undefined,
							},
							false,
							"selectClient - unset previous client",
						);
						// TODO clear cached data depending on the client
						return;
					}

					if (selectedClient && selectedClient.id === client.id)
						return;

					// TODO clear cached data depending on the client

					if (selectedClient && selectedClient.id !== client.id) {
						pingConnectionClose();
						set(
							{
								networkStatus: NetworkStatus.disconnected,
								selectedClient: undefined,
							},
							false,
							"selectClient - unset previous client",
						);
					}

					const status = await getClientStatus(client);
					if (status) {
						// TODO prepare model
						set(
							{
								networkStatus: NetworkStatus.connected,
								selectedClient: client,
							},
							false,
							"selectClient - set client",
						);
						pingConnectionStart();
					} else {
						pingConnectionClose();
						setNetworkStatus(NetworkStatus.disconnected);
					}
				},

				getSupportedData: async (flush?: boolean) => {
					const {sdkRef, cachePromise, selectedClient} = get();
					if (!sdkRef || !selectedClient) return undefined;
					const {sdk} = sdkRef;
					return cachePromise(
						StargateCacheKeyEnum.SupportedData,
						flush ?? false,
						async () => {
							const command =
								new SdStargateGetSupportedDataCommand(sdk);
							const result = await command.send({}, [
								selectedClient,
							]);
							return result.length > 0 ? result[0] : undefined;
						},
					);
				},

				cachePromise: async <T>(
					cacheType: StargateCacheKeyEnum,
					flush: boolean,
					initializer: () => Promise<T>,
				): Promise<T> => {
					const key = cacheType;
					const {genericCache} = get();

					if (!(key in genericCache) || flush) {
						const _promise = initializer();
						set(
							() => ({
								genericCache: {
									...genericCache,
									...{[key]: _promise},
								},
							}),
							false,
							`cachePromise ${key}`,
						);

						return _promise;
					}

					return genericCache[key];
				},
			}),
			{...devtoolsSettings, name: "ShapeDiver | Stargate"},
		),
	);
