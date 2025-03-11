import {devtoolsSettings} from "@AppBuilderShared/store/storeSettings";
import {
	IShapeDiverStorePlatformExtended,
	PlatformCacheKeyEnum,
} from "@AppBuilderShared/types/store/shapediverStorePlatform";
import {
	getDefaultPlatformUrl,
	getPlatformClientId,
	shouldUsePlatform,
} from "@AppBuilderShared/utils/platform/environment";
import {
	create as createSdk,
	isPBInvalidGrantOAuthResponseError,
	isPBInvalidRequestOAuthResponseError,
	SdPlatformResponseModelPublic,
	SdPlatformResponseUserSelf,
	SdPlatformUserGetEmbeddableFields,
} from "@shapediver/sdk.platform-api-sdk-v1";
import {create} from "zustand";
import {devtools} from "zustand/middleware";

/**
 * Store data related to the ShapeDiver Platform.
 * @see {@link IShapeDiverStorePlatform}
 */
export const useShapeDiverStorePlatform =
	create<IShapeDiverStorePlatformExtended>()(
		devtools(
			(set, get) => ({
				clientRef: undefined,
				user: undefined,
				currentModel: undefined,
				genericCache: {},

				authenticate: async (
					redirect: boolean = true,
					forceReAuthenticate?: boolean,
				) => {
					if (!shouldUsePlatform()) return;

					const {clientRef, cachePromise} = get();

					if (!forceReAuthenticate && clientRef) return clientRef;

					return cachePromise(
						PlatformCacheKeyEnum.Authenticate,
						forceReAuthenticate ?? false,
						async () => {
							const platformUrl = getDefaultPlatformUrl();
							const client = createSdk({
								clientId: getPlatformClientId(),
								baseUrl: platformUrl,
							});
							try {
								const result =
									await client.authorization.refreshToken();

								const sdkRef = {
									platformUrl,
									jwtToken: result.access_token,
									client,
								};

								set(
									() => ({
										clientRef: sdkRef,
									}),
									false,
									"authenticate",
								);

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

										set(
											() => ({
												clientRef: sdkRef,
											}),
											false,
											"authenticate",
										);

										return sdkRef;
									}

									if (
										window.location.origin ===
										"https://shapediver.com"
									) {
										// redirect to www.shapediver.com, because 3rd party auth requires it
										window.location.href = `https://www.shapediver.com${window.location.pathname}${window.location.search}`;
									} else {
										// redirect to platform login
										window.location.href = `${platformUrl}/app/login?redirect=${window.location.origin}${window.location.pathname}${window.location.search}`;
									}
								}

								throw error;
							}
						},
					);
				},

				getUser: async (forceRefresh?: boolean) => {
					if (!shouldUsePlatform()) return;

					const {user, cachePromise} = get();

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

							const result =
								await clientRef.client.users.get<SdPlatformResponseUserSelf>(
									userId,
									[
										SdPlatformUserGetEmbeddableFields.BackendSystem,
										SdPlatformUserGetEmbeddableFields.GlobalAccessDomains,
										SdPlatformUserGetEmbeddableFields.Organization,
									],
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
					const promise = genericCache[key];

					if (!promise || flush) {
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

					return promise;
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
