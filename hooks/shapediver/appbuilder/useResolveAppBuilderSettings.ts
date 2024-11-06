import useAsync from "../../misc/useAsync";
import { IAppBuilderSettings } from "../../../types/shapediver/appbuilder";
import { SdPlatformModelGetEmbeddableFields, create } from "@shapediver/sdk.platform-api-sdk-v1";
import { getPlatformClientId, shouldUsePlatform } from "../../../utils/platform/environment";
import { useShapeDiverStorePlatform } from "../../../store/useShapeDiverStorePlatform";

/**
 * In case the session settings contain a slug and a platformUrl, 
 * resolve the ticket, modelViewUrl and token from the platform.
 */
export default function useResolveAppBuilderSettings(settings : IAppBuilderSettings|undefined) {

	const authenticate = useShapeDiverStorePlatform(state => state.authenticate);

	// when running on the platform, try to get a token (refresh token grant)
	const { value: sdkRef, error: platformError } = useAsync(async () => {
		// in case query parameter "redirect" is set to "0", do not redirect
		// on authentication failure
		const params = new URLSearchParams(window.location.search);
		const redirect = params.get("redirect") === "0" ? false : true;
		
		return await authenticate(redirect);
	});

	// resolve session data using iframe embedding or token
	const { value, error, loading } = useAsync(async () => {
		if (shouldUsePlatform() && !sdkRef) return;
		if (!settings) return;
		
		const sessions = await Promise.all(settings.sessions.map(async session => {
			if (!session.slug || !session.platformUrl)
				return session;
			
			// in case we are running on the platform and the session is on the same platform,
			// use a model get call to get ticket, modelViewUrl and token
			if (shouldUsePlatform() && sdkRef?.platformUrl === session.platformUrl) {
				const getModel = async () => {
					const result = await sdkRef?.client.models.get(session.slug!, [
						SdPlatformModelGetEmbeddableFields.BackendSystem,
						SdPlatformModelGetEmbeddableFields.Ticket,
						SdPlatformModelGetEmbeddableFields.TokenExportFallback,
					]);
					
					return result?.data;
				};
				const model = await getModel();
				document.title = `${model?.title ?? model?.slug} | ShapeDiver App Builder`;
			
				return {
					// use the acceptRejectMode setting store on the platform
					// this can be overridden by the optional acceptRejectMode
					// setting in session
					acceptRejectMode: model.settings.parameters_commit,
					...session, 
					ticket: model!.ticket!.ticket,
					modelViewUrl: model!.backend_system!.model_view_url,
					jwtToken: model.access_token,
					refreshJwtToken: async () => {
						const model = await getModel();

						return model.access_token!;
					}
				};
			}
			// otherwise try to use iframe embedding
			else {
				const getIframeData = async () => {
					const client = create({ clientId: getPlatformClientId(), baseUrl: session.platformUrl });
					const result = await client.models.iframeEmbedding(session.slug!);
					
					return result.data;
				};
				const iframeData = await getIframeData();
			
				return {
					acceptRejectMode: iframeData.model.settings?.parameters_commit,
					...session, 
					ticket: iframeData.ticket,
					modelViewUrl: iframeData.model_view_url,
					jwtToken: iframeData.token,
					refreshJwtToken: async () => {
						const iframeData = await getIframeData();

						return iframeData.token;
					}
				};
			}
		}));

		const settingsResolved: IAppBuilderSettings = { 
			...settings, 
			sessions, 
		};

		return settingsResolved;
	}, [settings, sdkRef]);
	
	return {
		settings: value, 
		error: platformError ?? error, 
		loading
	};
}
