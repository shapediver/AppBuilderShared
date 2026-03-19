import {QUERYPARAM_PROVIDER} from "@AppBuilderLib/shared/config/queryparams";
import {
	IPlatformClientRef,
	IShapeDiverStorePlatformExtended,
	PlatformCacheKeyEnum,
} from "@AppBuilderLib/shared/config/shapediverStorePlatform";
import {devtoolsSettings} from "@AppBuilderLib/shared/config/storeSettings";
import {
	getDefaultPlatformUrl,
	getPlatformClientId,
	shouldUsePlatform,
} from "@AppBuilderLib/shared/lib/platform";
import {
	create as createSdk,
	isPBInvalidGrantOAuthResponseError,
	isPBInvalidRequestOAuthResponseError,
	isPBUnauthorizedResponseError,
	SdPlatformResponseModelPublic,
	SdPlatformResponseUserSelf,
	SdPlatformUserGetEmbeddableFields,
} from "@shapediver/sdk.platform-api-sdk-v1";
import {create} from "zustand";
import {devtools} from "zustand/middleware";

const LOCAL_STORAGE_REFRESH_TOKEN = "refresh_token";

// Private SDK reference - not accessible from outside the module
let clientRef: IPlatformClientRef | undefined = undefined;

/**
 * Store data related to the ShapeDiver Platform.
 * @see {@link IShapeDiverStorePlatform}
 */
export const useShapeDiverStorePlatform =
	create<IShapeDiverStorePlatformExtended>()(
		devtools(
			(set, get) => ({
				user: undefined,
				currentModel: undefined,
				genericCache: {},

				authWrapper: async <T>(
					cb: (clientRef: IPlatformClientRef) => Promise<T>,
					redirect: boolean = true,
				) => {
					const {authenticate} = get();
					const clientRef = await authenticate(redirect);
					if (!clientRef || !clientRef.jwtToken) {
						throw new Error("Authentication failed");
					}

					try {
						return await cb(clientRef);
					} catch (error) {
						if (
							isPBUnauthorizedResponseError(error) // <-- thrown if the access token is not valid anymore
							// && error.error_description === "..." // <-- to be clarified: check for specific error descriptions
						) {
							// try to re-authenticate
							const newClientRef = await authenticate(
								redirect,
								true,
							);
							if (!newClientRef || !newClientRef.jwtToken) {
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
					forceReAuthenticate?: boolean,
				) => {
					if (!shouldUsePlatform()) return;

					const {cachePromise} = get();

					if (!forceReAuthenticate && clientRef) return clientRef;

					return cachePromise(
						PlatformCacheKeyEnum.Authenticate,
						forceReAuthenticate ?? false,
						async () => {
							const platformUrl = getDefaultPlatformUrl();
							const client = createSdk({
								clientId: getPlatformClientId(),
								baseUrl: platformUrl,
								tokenStorage: {
									getRefreshToken: () => {
										return Promise.resolve(
											localStorage.getItem(
												LOCAL_STORAGE_REFRESH_TOKEN,
											),
										);
									},
									setRefreshToken: (token: string | null) => {
										if (token)
											localStorage.setItem(
												LOCAL_STORAGE_REFRESH_TOKEN,
												token,
											);
										else
											localStorage.removeItem(
												LOCAL_STORAGE_REFRESH_TOKEN,
											);
										return Promise.resolve();
									},
								},
							});
							try {
								const refreshToken = localStorage.getItem(
									LOCAL_STORAGE_REFRESH_TOKEN,
								);
								const result =
									await client.authorization.refreshToken(
										refreshToken ?? undefined,
									);

								const sdkRef = {
									platformUrl,
									jwtToken: result.access_token,
									client,
								};

								clientRef = sdkRef;

								return sdkRef;
							} catch (error) {
								if (
									isPBInvalidRequestOAuthResponseError(
										error,
									) || // <-- thrown if the refresh token is not valid anymore or there is none
									isPBInvalidGrantOAuthResponseError(error) // <-- thrown if the refresh token is generally invalid
								) {
									// in case authentication failed and redirect is disabled, return the unauthenticated client
									if (!redirect) {
										const sdkRef = {
											platformUrl,
											jwtToken: undefined,
											client,
										};

										clientRef = sdkRef;

										return sdkRef;
									}

									if (
										window.location.origin ===
										"https://shapediver.com"
									) {
										// redirect to www.shapediver.com, because 3rd party auth requires it
										window.location.href = `https://www.shapediver.com${window.location.pathname}${window.location.search}`;
									} else {
										// check for a "provider" query parameter
										const urlParams = new URLSearchParams(
											window.location.search,
										);
										const provider =
											urlParams.get(QUERYPARAM_PROVIDER);
										urlParams.delete(QUERYPARAM_PROVIDER);
										const encodedRedirect =
											encodeURIComponent(
												`${window.location.origin}${window.location.pathname}?${urlParams.toString()}`,
											);
										// redirect to platform login
										window.location.href = `${platformUrl}/app/login?${provider ? `provider=${provider}&` : ""}redirect=${encodedRedirect}`;
									}
								}

								throw error;
							}
						},
					);
				},

				getUser: async (forceRefresh?: boolean) => {
					if (!shouldUsePlatform()) return;

					const {user, cachePromise, authWrapper} = get();

					if (!forceRefresh && user) return user;

					return cachePromise(
						PlatformCacheKeyEnum.GetUser,
						forceRefresh ?? false,
						async () => {
							const clientRef = await get().authenticate();
							if (!clientRef || !clientRef.jwtToken) return;

							const userId =
								clientRef.client.authorization.authData.userId;
							if (!userId) return;

							const result = await authWrapper((c) =>
								c.client.users.get<SdPlatformResponseUserSelf>(
									userId,
									[
										SdPlatformUserGetEmbeddableFields.BackendSystem,
										SdPlatformUserGetEmbeddableFields.GlobalAccessDomains,
										SdPlatformUserGetEmbeddableFields.Organization,
									],
								),
							);

							const user = result.data;

							set(() => ({user}), false, "getUser");

							return user;
						},
					);
				},

				cachePromise: async <T>(
					cacheType: PlatformCacheKeyEnum,
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

				setCurrentModel: (
					model: SdPlatformResponseModelPublic | undefined,
				) => {
					set(
						() => ({currentModel: model}),
						false,
						"setCurrentModel",
					);
				},
			}),
			{...devtoolsSettings, name: "ShapeDiver | Platform"},
		),
	);
