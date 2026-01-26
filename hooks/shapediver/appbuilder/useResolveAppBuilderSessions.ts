import {
	getDefaultPlatformUrl,
	getPlatformClientId,
	shouldUsePlatform,
} from "@AppBuilderLib/shared/lib/platform";
import useAsync from "@AppBuilderShared/hooks/misc/useAsync";
import {useShapeDiverStorePlatform} from "@AppBuilderShared/store/useShapeDiverStorePlatform";
import {
	IAppBuilderSettingsJsonSession,
	IAppBuilderSettingsSession,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import {
	SdPlatformModelGetEmbeddableFields,
	SdPlatformResponseModelPublic,
	create,
} from "@shapediver/sdk.platform-api-sdk-v1";
import {useShallow} from "zustand/react/shallow";

import {QUERYPARAM_REDIRECT} from "@AppBuilderLib/shared/config/queryparams";
import {MODELS} from "@modelstorage";
import {useShapeDiverStorePlatformSavedStates} from "~/shared/store/useShapeDiverStorePlatformSavedStates";

// Type assertion for MODELS
const ModelStorage = MODELS as unknown as Record<
	string,
	SdPlatformResponseModelPublic
>;

/**
 * In case the session settings contain a slug and a platformUrl,
 * resolve the ticket, modelViewUrl and token from the platform.
 */
export default function useResolveAppBuilderSessions(
	sessions: IAppBuilderSettingsJsonSession[] | undefined,
) {
	const {authenticate, setCurrentModel} = useShapeDiverStorePlatform(
		useShallow((state) => ({
			authenticate: state.authenticate,
			setCurrentModel: state.setCurrentModel,
		})),
	);

	const {addItem: addSavedState} = useShapeDiverStorePlatformSavedStates(
		useShallow((state) => ({addItem: state.addItem})),
	);

	// when running on the platform, try to get a token (refresh token grant)
	const {value: sdkRef, error: platformError} = useAsync(async () => {
		// in case query parameter QUERYPARAM_REDIRECT is set to "0", do not redirect
		// on authentication failure
		const params = new URLSearchParams(window.location.search);
		const redirect = params.get(QUERYPARAM_REDIRECT) !== "0";

		return await authenticate(redirect);
	});

	// resolve session data using iframe embedding or token
	const {
		value: resolvedSessions,
		error,
		loading,
	} = useAsync(async () => {
		if (shouldUsePlatform() && !sdkRef) return;
		if (!sessions) return;

		const resolvedSessions = await Promise.all(
			sessions.map(async (session) => {
				const platformUrl =
					session.platformUrl ?? getDefaultPlatformUrl();

				if (!session.slug) {
					if (!session.ticket || !session.modelViewUrl)
						throw new Error(
							"Session definition must either contain slug, or ticket and modelViewUrl.",
						);

					// We don't have a slug, but we have a ticket and modelViewUrl.
					// This means that we try to get the corresponding settings from the viewer.
					// As the viewer needs to be loaded to do this, we set a flag, so that these
					// settings are appended once the viewer is loaded.
					session.loadPlatformSettingsFromViewer =
						shouldUsePlatform() &&
						sdkRef!.platformUrl === platformUrl
							? "platform"
							: "iframe";

					return session as IAppBuilderSettingsSession;
				}

				// special case for local development:
				// check if there is stored data for the slug
				// this will always fail in production!
				if (session.slug && ModelStorage[session.slug]) {
					// in case the slug is found in model storage, use the stored data
					const model = ModelStorage[session.slug];

					setCurrentModel(model);
					document.title = `${model?.title ?? model?.slug} | ShapeDiver App Builder`;

					// we store exactly the same data as in the platform response,
					// only leaving out the refresh token function
					return {
						acceptRejectMode: model.settings.parameters_commit,
						hideAttributeVisualization:
							model.settings.hide_attribute_visualization,
						hideJsonMenu: model.settings.hide_json_menu,
						hideSavedStates: model.settings.hide_saved_states,
						hideDesktopClients: model.settings.hide_desktop_clients,
						hideExports: model.settings.hide_exports,
						...session,
						ticket: model!.ticket!.ticket,
						modelViewUrl: model!.backend_system!.model_view_url,
						jwtToken: model.access_token,
					} as IAppBuilderSettingsSession;
				}
				// in case we are running on the platform and the session is on the same platform,
				// use a model get call to get ticket, modelViewUrl and token
				else if (
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
						hideJsonMenu: model.settings.hide_json_menu,
						hideSavedStates: model.settings.hide_saved_states,
						hideDesktopClients: model.settings.hide_desktop_clients,
						hideExports: model.settings.hide_exports,
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
							{saved_states: true},
						);

						return result.data;
					};
					const iframeData = await getIframeData();
					setCurrentModel(iframeData.model);
					for (const savedState of iframeData.model.saved_states ??
						[]) {
						addSavedState(savedState);
					}

					return {
						acceptRejectMode:
							iframeData.model.settings?.parameters_commit,
						hideAttributeVisualization:
							iframeData.model.settings
								?.hide_attribute_visualization_iframe,
						hideJsonMenu:
							iframeData.model.settings?.hide_json_menu_iframe,
						hideSavedStates:
							iframeData.model.settings?.hide_saved_states_iframe,
						hideExports:
							iframeData.model.settings?.hide_exports_iframe,
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
		return resolvedSessions;
	}, [sessions, sdkRef]);

	return {
		sessions: resolvedSessions,
		error: platformError ?? error,
		loading,
	};
}
