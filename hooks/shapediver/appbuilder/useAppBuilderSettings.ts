import useAsync from "@AppBuilderShared/hooks/misc/useAsync";
import useResolveAppBuilderSettings from "@AppBuilderShared/hooks/shapediver/appbuilder//useResolveAppBuilderSettings";
import {useThemeOverrideStore} from "@AppBuilderShared/store/useThemeOverrideStore";
import {
	IAppBuilderSettings,
	IAppBuilderSettingsJson,
	IAppBuilderSettingsJsonSession,
	IAppBuilderSettingsSession,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import {validateAppBuilderSettingsJson} from "@AppBuilderShared/types/shapediver/appbuildertypecheck";
import {
	QUERYPARAM_CONTEXT,
	QUERYPARAM_DISABLEFALLBACKUI,
	QUERYPARAM_MODELSTATEID,
	QUERYPARAM_MODELVIEWURL,
	QUERYPARAM_PARAMVALUE_PREFIX,
	QUERYPARAM_PLATFORMURL,
	QUERYPARAM_SETTINGSURL,
	QUERYPARAM_SLUG,
	QUERYPARAM_TEMPLATE,
	QUERYPARAM_TICKET,
} from "@AppBuilderShared/types/shapediver/queryparams";
import {getDefaultPlatformUrl} from "@AppBuilderShared/utils/platform/environment";
import {useEffect, useMemo} from "react";

/**
 * Test a string value for being "true" or "1".
 * @param value
 * @returns
 */
function isTrueish(value: string | null | undefined) {
	return value === "true" || value === "1";
}

/**
 * Load settings for the app builder from a JSON file defined by an URL query parameter.
 * As an alternative, use URL query parameters to define the session directly, based on
 *   * ticket and modelViewUrl, or
 *   * slug and platformUrl.
 *
 * @param defaultSession Default session definition to use if parameters could not be loaded.
 * @param queryParamName Name of the query parameter to use for loading settings json.
 * @returns
 */
export default function useAppBuilderSettings(
	defaultSession?: IAppBuilderSettingsSession,
	queryParamName = QUERYPARAM_SETTINGSURL,
) {
	const parameters = useMemo<URLSearchParams>(
		() => new URLSearchParams(window.location.search),
		[],
	);

	// try to load settings json
	const url = parameters.get(queryParamName);
	const validate = (data: any): IAppBuilderSettingsJson | undefined => {
		const result = validateAppBuilderSettingsJson(data);
		if (result.success) {
			return result.data;
		} else {
			throw new Error(
				`Parsing AppBuilder settings failed: ${result.error.message}`,
			);
		}
	};
	const {value, error, loading} = useAsync(async () => {
		if (!url) return;
		const response = await fetch(url, {mode: "cors"});

		return validate(await response.json());
	}, [url]);

	// check for ticket, modelViewUrl, slug and platformUrl
	const ticket = parameters.get(QUERYPARAM_TICKET);
	const modelViewUrl = parameters
		.get(QUERYPARAM_MODELVIEWURL)
		?.replace(/\/+$/, "");
	const slug = parameters.get(QUERYPARAM_SLUG);
	const platformUrl = parameters
		.get(QUERYPARAM_PLATFORMURL)
		?.replace(/\/+$/, "");
	const disableFallbackUi = isTrueish(
		parameters.get(QUERYPARAM_DISABLEFALLBACKUI),
	);
	const template = parameters.get(QUERYPARAM_TEMPLATE);
	const modelStateId =
		parameters.get(QUERYPARAM_MODELSTATEID) !== null
			? parameters.get(QUERYPARAM_MODELSTATEID)!
			: undefined;
	const context = parameters.get(QUERYPARAM_CONTEXT);

	// get all query parameters starting with QUERYPARAM_PARAMVALUE_PREFIX
	const paramValues = new Map<string, string>();
	parameters.forEach((value, key) => {
		if (key.startsWith(QUERYPARAM_PARAMVALUE_PREFIX))
			paramValues.set(key, value);
	});

	// define fallback session settings to be used in case loading from json failed
	// in case slug and optionally platformUrl are defined, use them
	// otherwise, if ticket and modelViewUrl are defined, use them
	const queryParamSession = useMemo<IAppBuilderSettingsSession | undefined>(
		() =>
			slug
				? ({
						id: "default",
						slug,
						platformUrl: platformUrl ?? getDefaultPlatformUrl(),
						modelStateId,
					} as IAppBuilderSettingsSession)
				: ticket && modelViewUrl
					? {id: "default", ticket, modelViewUrl, modelStateId}
					: undefined,
		[slug, platformUrl, ticket, modelViewUrl],
	);

	// define theme overrides based on query string params
	const themeOverrides = useMemo(() => {
		return template
			? {
					components: {
						AppBuilderTemplateSelector: {
							defaultProps: {
								template: template,
							},
						},
					},
				}
			: undefined;
	}, [template]);

	// create the session array in a memo, otherwise it is recreated every time
	const sessionsArray = useMemo<
		IAppBuilderSettingsJsonSession[] | undefined
	>(() => {
		if (loading) return undefined;

		if (!value) {
			// No JSON loaded, use query params or default session
			const session = defaultSession || queryParamSession;
			return session ? [session] : undefined;
		} else {
			// JSON loaded, combine with query params/default session
			const session = defaultSession || queryParamSession;
			const {sessions} = value;

			let combinedSessions: IAppBuilderSettingsJsonSession[] = [];
			if (session) combinedSessions.push(session);
			if (sessions) combinedSessions = combinedSessions.concat(sessions);

			return combinedSessions;
		}
	}, [loading, value, defaultSession, queryParamSession]);

	// create the settings object, either with the json data or without
	const settings = useMemo<IAppBuilderSettings | undefined>(() => {
		if (!sessionsArray) return undefined;
		if (loading) return undefined;

		if (!value) {
			return {
				version: "1.0",
				sessions: sessionsArray,
				settings: {disableFallbackUi},
				themeOverrides: themeOverrides,
			};
		} else {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const {sessions: _, ...rest} = value;
			return {
				sessions: sessionsArray,
				...rest,
			};
		}
	}, [loading, sessionsArray, value, disableFallbackUi, themeOverrides]);

	// register theme overrides
	const setThemeOverride = useThemeOverrideStore(
		(state) => state.setThemeOverride,
	);
	useEffect(() => {
		console.debug("Theme overrides", value);
		setThemeOverride(settings?.themeOverrides);
	}, [settings?.themeOverrides]);

	const {
		settings: resolvedSettings,
		error: resolveError,
		loading: resolveLoading,
	} = useResolveAppBuilderSettings(settings);

	// add context as an initial parameter value to all sessions
	if (context && resolvedSettings?.sessions) {
		for (let i = 0; i < resolvedSettings.sessions.length; i++) {
			const session = resolvedSettings.sessions[i];
			if (!session.initialParameterValues)
				session.initialParameterValues = {};
			session.initialParameterValues["context"] = context;
		}
	}

	// add parameter values defined in query string to all sessions
	if (paramValues.size > 0 && resolvedSettings?.sessions) {
		for (let i = 0; i < resolvedSettings.sessions.length; i++) {
			const session = resolvedSettings.sessions[i];
			if (!session.initialParameterValues)
				session.initialParameterValues = {};
			paramValues.forEach((value, key) => {
				session.initialParameterValues![
					key.substring(QUERYPARAM_PARAMVALUE_PREFIX.length)
				] = value;
			});
		}
	}

	return {
		settings: resolvedSettings,
		error: error || resolveError,
		loading: loading || resolveLoading,
		hasSettings: parameters.size > 0,
		hasSession:
			(settings?.sessions && settings.sessions.length > 0) ||
			(resolvedSettings?.sessions &&
				resolvedSettings.sessions.length > 0),
	};
}
