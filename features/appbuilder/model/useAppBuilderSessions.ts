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
	 * id is already loaded from the theme or settings, or used by an instance.
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
 * without the instance flags. A session id that also appears in `instances` is
 * skipped so the instance keeps that session. Sessions stay on the `useSessions`
 * list while the output still lists them, so removing one closes it.
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

	const embeddedSessions = useMemo(() => {
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
		const definitions = appBuilderData?.sessions;
		if (!definitions?.length) return owned;

		const createdSessionIds = new Set(createdSessionIdsRef.current.ids);
		const instanceSessionIds = new Set(
			appBuilderData?.instances?.map((instance) => instance.sessionId),
		);
		definitions.forEach((definition) => {
			// Instances own this id. Their session must stay hidden, so this
			// entry must not create a full session for the same id.
			if (instanceSessionIds.has(definition.sessionId)) {
				Logger.warn(
					`Session id "${definition.sessionId}" is already used by an instance. Skipping additional session.`,
				);
				return;
			}

			if (
				sessionIsLoaded(definition.sessionId) &&
				!createdSessionIds.has(definition.sessionId)
			)
				return;

			// use slug if available, otherwise use sessionId
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

			const initialParameterValues = definition.initialParameterValues;
			const existing = sessionDtoRef.current[definition.sessionId];
			if (!existing || existing.slug !== slug) {
				sessionDtoRef.current[definition.sessionId] = {
					id: definition.sessionId,
					slug,
					...(initialParameterValues &&
					Object.keys(initialParameterValues).length
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
		return owned;
	}, [appBuilderData, namespace]);

	const stableEmbeddedSessions = useStableByJson(embeddedSessions);
	const {sessions: sessionData, error: platformError} =
		useResolveAppBuilderSessions(stableEmbeddedSessions, false);
	const {errors: sessionErrors} = useSessions(sessionData ?? []);

	useEffect(() => {
		if (platformError)
			Logger.warn("Error resolving sessions:", platformError);

		for (const sessionError of sessionErrors)
			Logger.warn("Error creating sessions:", sessionError);
	}, [platformError, sessionErrors]);
}
