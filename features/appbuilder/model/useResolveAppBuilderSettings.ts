import {
	IAppBuilderSettings,
	IAppBuilderSettingsResolved,
} from "../config/appbuilder";
import {useMemo} from "react";
import useResolveAppBuilderSessions from "./useResolveAppBuilderSessions";

/**
 * In case the session settings contain a slug and a platformUrl,
 * resolve the ticket, modelViewUrl and token from the platform.
 */
export default function useResolveAppBuilderSettings(
	settings: IAppBuilderSettings | undefined,
) {
	// resolve session data using iframe embedding or token
	const {
		sessions: resolvedSessions,
		error,
		loading,
	} = useResolveAppBuilderSessions(settings?.sessions);

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
		error,
		loading,
	};
}
