import {
	ParameterValueDefinition,
	useResolveParameterValues,
} from "@AppBuilderLib/entities/parameter/model/useResolveParameterValues";
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {IUseSessionDto} from "@AppBuilderLib/entities/session/model/useSession";
import {useSessions} from "@AppBuilderLib/entities/session/model/useSessions";
import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {useEffect, useMemo, useRef} from "react";
import {IAppBuilder, IAppBuilderSettingsSession} from "../config/appbuilder";
import useResolveAppBuilderSessions from "./useResolveAppBuilderSessions";

interface Props {
	namespace: string;
	/**
	 * Parsed App Builder output. Sessions listed here are created unless that
	 * id is already loaded from the theme or settings.
	 */
	appBuilderData: IAppBuilder | undefined;
}

type EmbeddedSession = IUseSessionDto & IAppBuilderSettingsSession;

/**
 * Keep the same value while its JSON content is unchanged, so session
 * creation does not restart when the App Builder output is reparsed.
 */
function useStableByJson<T>(value: T): T {
	const key = JSON.stringify(value);
	const state = useRef<{key: string; value: T}>({key, value});
	if (state.current.key !== key) state.current = {key, value};
	return state.current.value;
}

/**
 * Create full sessions declared on the App Builder data output.
 * Same skip-if-loaded rule as the embedded sessions in {@link useAppBuilderInstances},
 * without the instance flags. Sessions stay on the `useSessions` list while the
 * output still lists them, so removing one closes it.
 */
export function useAppBuilderSessions(props: Props) {
	const {namespace, appBuilderData} = props;
	const {sessions, pendingSessions} = useShapeDiverStoreSession();
	const sessionsRef = useRef(sessions);
	const pendingSessionsRef = useRef(pendingSessions);
	/** Ids this hook has accepted, so a later parse does not treat them as theme sessions. */
	const createdSessionIdsRef = useRef<{namespace: string; ids: string[]}>({
		namespace,
		ids: [],
	});
	/** Create DTOs from the first time each id was accepted. Parameter updates do not recreate the session. */
	const sessionDtoRef = useRef<Record<string, EmbeddedSession>>({});

	useEffect(() => {
		sessionsRef.current = sessions;
		pendingSessionsRef.current = pendingSessions;
	}, [sessions, pendingSessions]);

	const {embeddedSessions, parameterValues} = useMemo(() => {
		const sessionIsLoaded = (sessionId: string) =>
			!!sessionsRef.current[sessionId] ||
			!!Object.values(pendingSessionsRef.current).find(
				(session) => session.dto.id === sessionId,
			);

		if (createdSessionIdsRef.current.namespace !== namespace) {
			createdSessionIdsRef.current = {namespace, ids: []};
			sessionDtoRef.current = {};
		}

		const owned: EmbeddedSession[] = [];
		const parameterValues: ParameterValueDefinition[] = [];
		const definitions = appBuilderData?.sessions;
		if (!definitions?.length)
			return {embeddedSessions: owned, parameterValues};

		const createdSessionIds = new Set(createdSessionIdsRef.current.ids);
		definitions.forEach((definition) => {
			if (
				sessionIsLoaded(definition.sessionId) &&
				!createdSessionIds.has(definition.sessionId)
			)
				return;

			const slug = definition.slug || definition.sessionId;
			const duplicateSlug = owned.find(
				(session) => session.slug === slug,
			);
			if (duplicateSlug) {
				if (duplicateSlug.id !== definition.sessionId) {
					Logger.warn(
						`Multiple sessions are using the same slug "${slug}" but different session ids ("${duplicateSlug.id}" and "${definition.sessionId}"). This can lead to unexpected behavior.`,
					);
				}
				return;
			}
			if (owned.some((session) => session.id === definition.sessionId)) {
				Logger.warn(
					`Duplicate session id "${definition.sessionId}". Session ids must be unique, skipping session.`,
				);
				return;
			}

			const initialParameterValues: {[key: string]: string} = {};
			Object.entries(definition.parameterValues ?? {}).forEach(
				([key, value]) => {
					if (
						typeof value === "string" ||
						typeof value === "number" ||
						typeof value === "boolean"
					)
						initialParameterValues[key] = value + "";

					parameterValues.push({
						id: key,
						value,
						namespace: definition.sessionId,
					});
				},
			);

			const existing = sessionDtoRef.current[definition.sessionId];
			if (!existing || existing.slug !== slug) {
				sessionDtoRef.current[definition.sessionId] = {
					id: definition.sessionId,
					slug,
					...(Object.keys(initialParameterValues).length
						? {initialParameterValues}
						: {}),
				} as EmbeddedSession;
			}
			owned.push(sessionDtoRef.current[definition.sessionId]);
		});

		const ownedIds = new Set(owned.map((session) => session.id));
		for (const id of Object.keys(sessionDtoRef.current)) {
			if (!ownedIds.has(id)) delete sessionDtoRef.current[id];
		}
		createdSessionIdsRef.current = {
			namespace,
			ids: owned.map((session) => session.id),
		};
		return {embeddedSessions: owned, parameterValues};
	}, [appBuilderData, namespace]);

	const stableEmbeddedSessions = useStableByJson(embeddedSessions);
	const stableParameterValues = useStableByJson(parameterValues);
	const {sessions: sessionData, error: platformError} =
		useResolveAppBuilderSessions(stableEmbeddedSessions, false);
	const {errors: sessionErrors} = useSessions(sessionData ?? []);

	useEffect(() => {
		if (platformError)
			Logger.warn("Error resolving sessions:", platformError);

		for (const sessionError of sessionErrors)
			Logger.warn("Error creating sessions:", sessionError);
	}, [platformError, sessionErrors]);

	const parameterValuesReady = useMemo(() => {
		if (!stableParameterValues.length) return undefined;
		if (
			stableParameterValues.some(
				(parameter) =>
					!parameter.namespace || !sessions[parameter.namespace],
			)
		)
			return undefined;
		return stableParameterValues;
	}, [stableParameterValues, sessions]);
	const {values: resolvedParameterValues} = useResolveParameterValues({
		namespace,
		parameterValues: parameterValuesReady,
	});
	const parameterStoreIds = useShapeDiverStoreParameters((state) =>
		Object.keys(state.parameterStores).join("\0"),
	);
	const appliedParameterKeyRef = useRef("");

	useEffect(() => {
		if (!parameterValuesReady || !resolvedParameterValues) return;
		if (resolvedParameterValues.length !== parameterValuesReady.length)
			return;

		const stores = useShapeDiverStoreParameters.getState().parameterStores;
		for (const parameter of parameterValuesReady) {
			if (!parameter.namespace || !stores[parameter.namespace]) return;
		}

		const state: {
			[sessionId: string]: {[parameterId: string]: string};
		} = {};
		parameterValuesReady.forEach((parameter, index) => {
			const sessionId = parameter.namespace!;
			if (!state[sessionId]) state[sessionId] = {};
			state[sessionId][parameter.id] =
				resolvedParameterValues[index] ?? "";
		});

		const initialState: {
			[sessionId: string]: {[parameterId: string]: string};
		} = {};
		for (const session of stableEmbeddedSessions) {
			if (!session.initialParameterValues) continue;
			initialState[session.id] = session.initialParameterValues;
		}

		const key = JSON.stringify(state);
		if (
			key === appliedParameterKeyRef.current ||
			key === JSON.stringify(initialState)
		) {
			appliedParameterKeyRef.current = key;
			return;
		}

		void useShapeDiverStoreParameters
			.getState()
			.batchParameterValueUpdate(state, true, true)
			.then(() => {
				appliedParameterKeyRef.current = key;
			})
			.catch((updateError) => {
				Logger.warn(
					"Error applying additional session parameter values:",
					updateError,
				);
			});
	}, [
		parameterStoreIds,
		parameterValuesReady,
		resolvedParameterValues,
		stableEmbeddedSessions,
	]);
}
