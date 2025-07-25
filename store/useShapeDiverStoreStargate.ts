import {GlobalNotificationContext} from "@AppBuilderShared/context/NotificationContext";
import {devtoolsSettings} from "@AppBuilderShared/store/storeSettings";
import {NetworkStatus} from "@AppBuilderShared/types/shapediver/stargate";
import {
	IShapeDiverStoreStargateExtended,
	StargateCacheKeyEnum,
} from "@AppBuilderShared/types/store/shapediverStoreStargate";
import {exceptionWrapperAsync} from "@AppBuilderShared/utils/exceptionWrapper";
import {shouldUsePlatform} from "@AppBuilderShared/utils/platform/environment";
import type {ISdStargateClientModel} from "@shapediver/sdk.stargate-sdk-v1";
import {create} from "zustand";
import {devtools} from "zustand/middleware";
import {useShapeDiverStoreErrorReporting} from "./useShapeDiverStoreErrorReporting";
import {useShapeDiverStorePlatform} from "./useShapeDiverStorePlatform";

// Dynamic import function for stargate SDK
const importStargateSDK = () => import("@shapediver/sdk.stargate-sdk-v1");

let pingTimeout: NodeJS.Timeout | null = null;
const PING_INTERVAL_MS = 1000 * 30; // 30 seconds
let stargateSDKPromise: ReturnType<typeof importStargateSDK> | null = null;

export const getStargateSDK = async () => {
	if (!stargateSDKPromise) {
		stargateSDKPromise = importStargateSDK();
	}
	return await stargateSDKPromise;
};
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

				referenceCount: 0,

				registerReference: () => {
					set(
						(state) => ({
							referenceCount: state.referenceCount + 1,
						}),
						false,
						"registerReference",
					);
					return () =>
						set(
							(state) => ({
								referenceCount: state.referenceCount - 1,
							}),
							false,
							"unregisterReference",
						);
				},

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

					const {errorReporting} =
						useShapeDiverStoreErrorReporting.getState();

					if (!forceReconnect && sdkRef) return sdkRef;

					return cachePromise(
						StargateCacheKeyEnum.Authenticate,
						forceReconnect ?? false,
						async () => {
							const {createSdk} = await getStargateSDK();

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
									const msg =
										"Received unidentified Stargate command payload";
									errorReporting.captureMessage(
										`${msg}: ${payload}`,
									);
								})
								.setConnectionErrorHandler((msg: string) => {
									const message = `Stargate connection error: ${msg}`;
									GlobalNotificationContext.error({message});
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

					const {SdStargateStatusCommand} = await getStargateSDK();

					const result = await exceptionWrapperAsync(async () => {
						const command = new SdStargateStatusCommand(sdk);
						return await command.send({}, [client]);
					});
					return result.data && result.data.length > 0
						? result.data[0]
						: undefined;
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

				pingConnectionStart: () => {
					const {getClientStatus} = get();
					pingConnectionClose();
					pingTimeout = setInterval(async () => {
						const status = await getClientStatus();
						if (!status) {
							const {selectedClient} = get();
							const message = selectedClient?.clientName
								? `Connection to desktop client "${selectedClient?.clientName}" was lost.`
								: "Connection to desktop client was lost.";
							GlobalNotificationContext.warning({message});
							pingConnectionClose();
							set(
								{
									networkStatus: NetworkStatus.disconnected,
									selectedClient: undefined,
								},
								false,
								"pingConnection - status check failed",
							);
						}
					}, PING_INTERVAL_MS);
				},

				prepareModel: async (
					modelId: string,
					client?: ISdStargateClientModel,
				) => {
					const {sdkRef, selectedClient} = get();
					if (!sdkRef) return;

					const clientToUse = client || selectedClient;
					if (!clientToUse) return;

					const {SdStargatePrepareModelCommand} =
						await getStargateSDK();

					const command = new SdStargatePrepareModelCommand(
						sdkRef.sdk,
					);
					const response = await command.send(
						{model: {id: modelId}},
						[clientToUse],
					);
					if (!response || response.length === 0) return;
					return response[0];
				},

				selectClient: async (
					client: ISdStargateClientModel | undefined,
				) => {
					const {
						selectedClient,
						getClientStatus,
						pingConnectionStart,
						prepareModel,
						pruneCache,
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
						// Prune the cache depending on the selected client
						pruneCache(StargateCacheKeyEnum.SupportedData);
						return;
					}

					if (selectedClient && selectedClient.id === client.id)
						return;

					// Prune the cache depending on the selected client
					pruneCache(StargateCacheKeyEnum.SupportedData);

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
						// prepare model (don't wait for it on purpose)
						const {currentModel} =
							useShapeDiverStorePlatform.getState();
						if (currentModel) {
							const {ISdStargatePrepareModelResultEnum} =
								await getStargateSDK();

							prepareModel(currentModel.id, client).then(
								(response) => {
									if (
										!response ||
										response.info.result !==
											ISdStargatePrepareModelResultEnum.SUCCESS
									) {
										pingConnectionClose();
										set(
											{
												networkStatus:
													NetworkStatus.disconnected,
												selectedClient: undefined,
											},
											false,
											"selectClient - prepare model failed",
										);
										if (response?.info?.message) {
											GlobalNotificationContext.error({
												title: "Preparing model failed",
												message: response.info.message,
											});
										}
									}
								},
							);
						}
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
						set(
							{
								networkStatus: NetworkStatus.disconnected,
								selectedClient: undefined,
							},
							false,
							"selectClient - no client status",
						);
						GlobalNotificationContext.error({
							message: `Connection to desktop client "${client.clientName}" could not be established.`,
						});
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
							const {SdStargateGetSupportedDataCommand} =
								await getStargateSDK();

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
							{
								genericCache: {
									...genericCache,
									...{[key]: _promise},
								},
							},
							false,
							`cachePromise ${key}`,
						);

						return _promise;
					}

					return genericCache[key];
				},

				pruneCache: (cacheType: StargateCacheKeyEnum) => {
					const {genericCache} = get();
					const key = cacheType;
					if (key in genericCache) {
						const newCache = {...genericCache};
						delete newCache[key];
						if (
							Object.keys(newCache).length ===
							Object.keys(genericCache).length
						)
							return;
						set(
							{
								genericCache: newCache,
							},
							false,
							`pruneCache ${key}`,
						);
					}
				},
			}),
			{...devtoolsSettings, name: "ShapeDiver | Stargate"},
		),
	);
