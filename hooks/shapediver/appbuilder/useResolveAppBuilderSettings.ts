import useAsync from "@AppBuilderShared/hooks/misc/useAsync";
import {useShapeDiverStorePlatform} from "@AppBuilderShared/store/useShapeDiverStorePlatform";
import {useShapeDiverStorePlatformSavedStates} from "@AppBuilderShared/store/useShapeDiverStorePlatformSavedStates";
import {
	IAppBuilderSettings,
	IAppBuilderSettingsResolved,
	IAppBuilderSettingsSession,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import {
	getDefaultPlatformUrl,
	getPlatformClientId,
	shouldUsePlatform,
} from "@AppBuilderShared/utils/platform/environment";
import {
	SdPlatformModelGetEmbeddableFields,
	create,
} from "@shapediver/sdk.platform-api-sdk-v1";
import {useEffect} from "react";
import {useShallow} from "zustand/react/shallow";

/**
 * In case the session settings contain a slug and a platformUrl,
 * resolve the ticket, modelViewUrl and token from the platform.
 */
export default function useResolveAppBuilderSettings(
	settings: IAppBuilderSettings | undefined,
) {
	const {authenticate, setCurrentModel} = useShapeDiverStorePlatform(
		useShallow((state) => ({
			authenticate: state.authenticate,
			setCurrentModel: state.setCurrentModel,
		})),
	);

	// TODO remove this
	// temporary saved state testing
	const {currentModel} = useShapeDiverStorePlatform();
	const {useQuery} = useShapeDiverStorePlatformSavedStates();
	const {
		loading: savedStateLoading,
		error: savedStateError,
		items,
		hasMore,
		loadMore,
	} = useQuery({
		queryParams: {},
		filterByModel: currentModel?.id,
	});
	useEffect(() => {
		if (hasMore) {
			loadMore();
		}
	}, [currentModel, items, hasMore]);
	console.log(savedStateLoading, savedStateError, items, hasMore);
	// END remove this

	// when running on the platform, try to get a token (refresh token grant)
	const {value: sdkRef, error: platformError} = useAsync(async () => {
		// in case query parameter "redirect" is set to "0", do not redirect
		// on authentication failure
		const params = new URLSearchParams(window.location.search);
		const redirect = params.get("redirect") === "0" ? false : true;

		return await authenticate(redirect);
	});

	// resolve session data using iframe embedding or token
	const {value, error, loading} = useAsync(async () => {
		if (shouldUsePlatform() && !sdkRef) return;
		if (!settings) return;

		const sessions = await Promise.all(
			settings.sessions.map(async (session) => {
				if (!session.slug) {
					if (!session.ticket || !session.modelViewUrl)
						throw new Error(
							"Session definition must either contain slug, or ticket and modelViewUrl.",
						);

					return session as IAppBuilderSettingsSession;
				}

				const platformUrl =
					session.platformUrl ?? getDefaultPlatformUrl();

				// in case we are running on the platform and the session is on the same platform,
				// use a model get call to get ticket, modelViewUrl and token
				if (
					shouldUsePlatform() &&
					sdkRef!.platformUrl === platformUrl
				) {
					const getModel = async () => {
						const result = await sdkRef!.client.models.get(
							session.slug!,
							[
								SdPlatformModelGetEmbeddableFields.BackendSystem,
								SdPlatformModelGetEmbeddableFields.Tags,
								SdPlatformModelGetEmbeddableFields.Ticket,
								SdPlatformModelGetEmbeddableFields.TokenExportFallback,
								SdPlatformModelGetEmbeddableFields.User,
							],
						);

						return result?.data;
					};
					const model = await getModel();
					setCurrentModel(model);
					document.title = `${model?.title ?? model?.slug} | ShapeDiver App Builder`;

					return {
						// use the acceptRejectMode setting store on the platform
						// this can be overridden by the optional acceptRejectMode
						// setting in session
						acceptRejectMode: model.settings.parameters_commit,
						hideAttributeVisualization:
							model.settings.hide_attribute_visualization,
						...session,
						ticket: model!.ticket!.ticket,
						modelViewUrl: model!.backend_system!.model_view_url,
						jwtToken: model.access_token,
						refreshJwtToken: async () => {
							const model = await getModel();

							return model.access_token!;
						},
					} as IAppBuilderSettingsSession;
				}
				// otherwise try to use iframe embedding
				else {
					const getIframeData = async () => {
						const client = create({
							clientId: getPlatformClientId(),
							baseUrl: platformUrl,
						});
						const result = await client.models.iframeEmbedding(
							session.slug!,
						);

						return result.data;
					};
					const iframeData = await getIframeData();

					return {
						acceptRejectMode:
							iframeData.model.settings?.parameters_commit,
						hideAttributeVisualization:
							iframeData.model.settings
								?.hide_attribute_visualization,
						...session,
						ticket: iframeData.ticket,
						modelViewUrl: iframeData.model_view_url,
						jwtToken: iframeData.token,
						refreshJwtToken: async () => {
							const iframeData = await getIframeData();

							return iframeData.token;
						},
					} as IAppBuilderSettingsSession;
				}
			}),
		);

		const settingsResolved: IAppBuilderSettingsResolved = {
			...settings,
			sessions,
		};

		return settingsResolved;
	}, [settings, sdkRef]);

	return {
		settings: value,
		error: platformError ?? error,
		loading,
	};
}
