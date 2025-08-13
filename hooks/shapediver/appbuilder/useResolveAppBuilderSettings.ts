import useAsync from "@AppBuilderShared/hooks/misc/useAsync";
import {useShapeDiverStorePlatform} from "@AppBuilderShared/store/useShapeDiverStorePlatform";
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
import {useMemo} from "react";
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

	// when running on the platform, try to get a token (refresh token grant)
	const {value: sdkRef, error: platformError} = useAsync(async () => {
		// in case query parameter "redirect" is set to "0", do not redirect
		// on authentication failure
		const params = new URLSearchParams(window.location.search);
		const redirect = params.get("redirect") === "0" ? false : true;

		return await authenticate(redirect);
	});

	// resolve session data using iframe embedding or token
	const {
		value: resolvedSessions,
		error,
		loading,
	} = useAsync(async () => {
		if (shouldUsePlatform() && !sdkRef) return;
		if (!settings?.sessions) return;

		const sessions = await Promise.all(
			settings.sessions.map(async (session) => {
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
						hideJsonMenu: model.settings.hide_json_menu,
						hideSavedStates: model.settings.hide_saved_states,
						hideDesktopClients: model.settings.hide_desktop_clients,
						hideDataOutputs: model.settings.hide_data_outputs,
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
						);

						return result.data;
					};
					const iframeData = await getIframeData();

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
						hideDataOutputs:
							iframeData.model.settings?.hide_data_outputs_iframe,
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
		return sessions;
	}, [settings?.sessions, sdkRef]);

	// Create the final resolved settings combining current settings with resolved sessions
	const settingsResolved = useMemo<
		IAppBuilderSettingsResolved | undefined
	>(() => {
		if (!settings || !resolvedSessions) return undefined;

		return {
			...settings,
			sessions: resolvedSessions,
		};
	}, [settings, resolvedSessions]);

	return {
		settings: settingsResolved,
		error: platformError ?? error,
		loading,
	};
}
