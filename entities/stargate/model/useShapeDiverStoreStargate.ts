import {
	IShapeDiverStoreStargateExtended,
	IStargateClientRef,
	NetworkStatus,
	StargateCacheKeyEnum,
} from "@AppBuilderLib/entities/stargate";
import {getNotificationActions} from "@AppBuilderLib/features";
import {devtoolsSettings} from "@AppBuilderLib/shared/config";
import {
	exceptionWrapperAsync,
	shouldUsePlatform,
} from "@AppBuilderLib/shared/lib";
import {
	useShapeDiverStoreErrorReporting,
	useShapeDiverStorePlatform,
} from "@AppBuilderLib/shared/model";
import {
	SdStargateError,
	SdStargateErrorTypes,
	type ISdStargateClientModel,
} from "@shapediver/sdk.stargate-sdk-v1";
import {create} from "zustand";
import {devtools} from "zustand/middleware";

// Dynamic import function for stargate SDK
const importStargateSDK = () => import("@shapediver/sdk.stargate-sdk-v1");

let pingTimeout: NodeJS.Timeout | null = null;
const PING_INTERVAL_MS = 1000 * 30; // 30 seconds
let stargateSDKPromise: ReturnType<typeof importStargateSDK> | null = null;

// Private SDK reference - not accessible from outside the module
let sdkRef: IStargateClientRef | undefined = undefined;

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

interface IShapeDiverStoreStargateInternal extends IShapeDiverStoreStargateExtended {
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
					sdkRef = undefined;
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

				authWrapper: async <T>(
					cb: (clientRef: IStargateClientRef) => Promise<T>,
					redirect: boolean = true,
				) => {
					const {authenticate} = get();
					const clientRef = await authenticate(redirect);
					if (!clientRef) {
						throw new Error("Authentication failed");
					}

					try {
						return await cb(clientRef);
					} catch (error) {
						if (
							error instanceof SdStargateError &&
							error.type === SdStargateErrorTypes.NotAuthenticated
						) {
							// This means that the client ID was not found. In this case we need to get a fresh
							// JWT and run the `register` command again - that's it!
							//
							// Side note - some technical details:
							//   The client/SDK never receives any client ID. This ID is the unique ID of the
							//   websocket connection and handled exclusively on the backend side. That's why
							//   you don't have to do anything but calling `register` to make it work again.
							const newClientRef = await authenticate(
								redirect,
								true,
							);
							if (!newClientRef) {
								console.error("Re-authentication failed");
								throw error;
							}
							return await cb(newClientRef);
						} else {
							throw error;
						}
					}
				},

				authenticate: async (
					redirect: boolean = true,
					forceReconnect?: boolean,
				) => {
					if (!shouldUsePlatform()) return;

					const {cachePromise, handleDisconnect} = get();
					const {errorReporting} =
						useShapeDiverStoreErrorReporting.getState();

					if (!forceReconnect && sdkRef) return sdkRef;

					return cachePromise(
						StargateCacheKeyEnum.Authenticate,
						forceReconnect ?? false,
						async () => {
							const {createSdk} = await getStargateSDK();
							const {authenticate, authWrapper} =
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
							} = await authWrapper((c) =>
								c.client.stargate.getConfig(),
							);
							const url =
								typeof endpoint === "string"
									? endpoint
									: Object.values(endpoint)[0];

							const sdk = await authWrapper(async (c) => {
								const sdk = await createSdk()
									.setBaseUrl(url)
									.setServerCommandHandler(
										(payload: unknown) => {
											const msg =
												"Received unidentified Stargate command payload";
											errorReporting.captureMessage(
												`${msg}: ${payload}`,
											);
										},
									)
									.setConnectionErrorHandler(
										(msg: string) => {
											const message = `Stargate connection error: ${msg}`;
											getNotificationActions().error({
												message,
											});
										},
									)
									.setDisconnectHandler(handleDisconnect)
									.build();

								await sdk.register(
									c.jwtToken!,
									"React App Builder",
									"1.0.0",
									navigator.platform || "",
									window.location.hostname,
									"",
								);
								return sdk;
							});

							sdkRef = {sdk};
							set(
								{
									networkStatus: NetworkStatus.disconnected,
								},
								false,
								"authenticate",
							);
							return sdkRef;
						},
					);
				},

				getClientStatus: async (_client?: ISdStargateClientModel) => {
					const {authWrapper, selectedClient} = get();
					const client = _client || selectedClient;

					return await authWrapper(async (sdkRef) => {
						if (!sdkRef || !client) return undefined;
						const {sdk} = sdkRef;

						const {SdStargateStatusCommand} =
							await getStargateSDK();

						const result = await exceptionWrapperAsync(async () => {
							const command = new SdStargateStatusCommand(sdk);
							return await command.send({}, [client]);
						});
						return result.data && result.data.length > 0
							? result.data[0]
							: undefined;
					});
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
							getNotificationActions().warning({message});
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
					const {authWrapper, selectedClient} = get();
					return await authWrapper(async (sdkRef) => {
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
					});
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
											getNotificationActions().error({
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
						getNotificationActions().error({
							message: `Connection to desktop client "${client.clientName}" could not be established.`,
						});
					}
				},

				getSupportedData: async (flush?: boolean) => {
					const {authWrapper, cachePromise, selectedClient} = get();
					if (!selectedClient) return undefined;
					return await authWrapper(async (sdkRef) => {
						if (!sdkRef) return undefined;
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
								return result.length > 0
									? result[0]
									: undefined;
							},
						);
					});
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
