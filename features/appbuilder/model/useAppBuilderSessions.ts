import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {IUseSessionDto} from "@AppBuilderLib/entities/session/model/useSession";
import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {useEventTracking} from "@AppBuilderLib/shared/lib/useEventTracking";
import {useEffect, useMemo, useRef, useState} from "react";
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

const sessionSlug = (session: {slug?: string}) => session.slug ?? "";

/**
 * `closeSession` reports failure by leaving the session in the store.
 * Returns whether that id is gone afterwards.
 */
async function closeTrackedSession(sessionId: string): Promise<boolean> {
	const {closeSession, sessions} = useShapeDiverStoreSession.getState();
	if (!sessions[sessionId]) return true;
	try {
		await closeSession(sessionId);
	} catch (error) {
		Logger.warn("Error closing sessions:", error);
		return false;
	}
	if (useShapeDiverStoreSession.getState().sessions[sessionId]) {
		Logger.warn(`Error closing session "${sessionId}".`);
		return false;
	}
	return true;
}

/**
 * Create full sessions declared on the App Builder data output.
 * Same skip-if-loaded rule as the embedded sessions in {@link useAppBuilderInstances},
 * without the instance flags. A session id that also appears in `instances` is
 * skipped so the instance keeps that session. A session stays open while the
 * output lists it. Adding or removing one session does not recreate the others.
 */
export function useAppBuilderSessions(props: Props) {
	const {namespace, appBuilderData} = props;
	const eventTracking = useEventTracking();
	/** Ids this hook has accepted, so a later parse does not treat them as theme sessions. */
	const createdSessionIdsRef = useRef<{namespace: string; ids: string[]}>({
		namespace,
		ids: [],
	});
	/** Create DTOs from the first time each id was accepted. Parameter updates do not recreate the session. */
	const sessionDtoRef = useRef<Record<string, EmbeddedSession>>({});
	/** Slug currently open for each id this hook created. */
	const liveSlugsRef = useRef<Map<string, string>>(new Map());
	const desiredSessionsRef = useRef<EmbeddedSession[]>([]);
	const promiseChainRef = useRef(Promise.resolve());
	const unmountedRef = useRef(false);
	/** Skip warnings already logged for this controller namespace. */
	const warnedRef = useRef<Set<string>>(new Set());

	const embeddedSessions = useMemo(() => {
		const {sessions, pendingSessions} =
			useShapeDiverStoreSession.getState();
		const sessionIsLoaded = (sessionId: string) =>
			!!sessions[sessionId] ||
			!!Object.values(pendingSessions).find(
				(session) => session.dto.id === sessionId,
			);

		if (createdSessionIdsRef.current.namespace !== namespace) {
			// Keep ids this hook still has open. Forgetting them makes the
			// next parse treat those sessions as foreign and close them.
			const liveIds = [...liveSlugsRef.current.keys()];
			createdSessionIdsRef.current = {namespace, ids: liveIds};
			for (const id of Object.keys(sessionDtoRef.current)) {
				if (!liveSlugsRef.current.has(id))
					delete sessionDtoRef.current[id];
			}
			warnedRef.current.clear();
		}

		const warnOnce = (key: string, message: string) => {
			if (warnedRef.current.has(key)) return;
			warnedRef.current.add(key);
			Logger.warn(message);
		};

		const owned: EmbeddedSession[] = [];
		const definitions = appBuilderData?.sessions;
		if (!definitions?.length) {
			// The sessions are gone, so the next time they are listed they
			// must be created from the current initial parameter values.
			sessionDtoRef.current = {};
			createdSessionIdsRef.current = {namespace, ids: []};
			return owned;
		}

		const createdSessionIds = new Set(createdSessionIdsRef.current.ids);
		const instanceSessionIds = new Set(
			appBuilderData?.instances?.map((instance) => instance.sessionId),
		);
		definitions.forEach((definition) => {
			// Instances own this id. Their session must stay hidden, so this
			// entry must not create a full session for the same id.
			if (instanceSessionIds.has(definition.sessionId)) {
				warnOnce(
					`instance:${definition.sessionId}`,
					`Session id "${definition.sessionId}" is already used by an instance. Skipping additional session.`,
				);
				return;
			}

			if (
				sessionIsLoaded(definition.sessionId) &&
				!createdSessionIds.has(definition.sessionId) &&
				!liveSlugsRef.current.has(definition.sessionId)
			) {
				warnOnce(
					`exists:${definition.sessionId}`,
					`Session id "${definition.sessionId}" already exists. Skipping additional session.`,
				);
				return;
			}

			// use slug if available, otherwise use sessionId
			const slug = definition.slug || definition.sessionId;
			const duplicateSlug = owned.find(
				(session) => session.slug === slug,
			);
			if (duplicateSlug) {
				if (duplicateSlug.id !== definition.sessionId) {
					warnOnce(
						`slug:${slug}:${duplicateSlug.id}:${definition.sessionId}`,
						`Multiple sessions are using the same slug "${slug}" but different session ids ("${duplicateSlug.id}" and "${definition.sessionId}"). This can lead to unexpected behavior.`,
					);
				}
				return;
			}
			if (owned.some((session) => session.id === definition.sessionId)) {
				warnOnce(
					`duplicate:${definition.sessionId}`,
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
	desiredSessionsRef.current = stableEmbeddedSessions;
	const [retryResolve, setRetryResolve] = useState(false);
	// While a resolve is failing, the next output must try again even when
	// the session list itself did not change.
	const sessionsForResolve = useMemo(() => {
		if (!retryResolve) return stableEmbeddedSessions;
		return stableEmbeddedSessions.slice();
	}, [appBuilderData, retryResolve, stableEmbeddedSessions]);
	const {
		sessions: sessionData,
		error: platformError,
		resolveErrors,
	} = useResolveAppBuilderSessions(sessionsForResolve, false, true);

	// Close sessions that left the output, or whose slug changed. Sessions
	// that are still listed stay open while the next list is resolving.
	useEffect(() => {
		// appBuilderData is a dependency so a failed close is tried again
		// on the next output, even when the session list did not change.
		void appBuilderData;
		const removed: string[] = [];
		for (const [id, slug] of liveSlugsRef.current) {
			const desired = stableEmbeddedSessions.find(
				(session) => session.id === id,
			);
			if (!desired || sessionSlug(desired) !== slug) removed.push(id);
		}
		if (!removed.length) return;

		promiseChainRef.current = promiseChainRef.current
			.then(async () => {
				const {removeSession} = useShapeDiverStoreParameters.getState();
				for (const id of removed) {
					const liveSlug = liveSlugsRef.current.get(id);
					if (liveSlug === undefined) continue;
					const desired = desiredSessionsRef.current.find(
						(session) => session.id === id,
					);
					if (desired && sessionSlug(desired) === liveSlug) continue;

					if (!(await closeTrackedSession(id))) continue;
					removeSession(id);
					if (liveSlugsRef.current.get(id) === liveSlug)
						liveSlugsRef.current.delete(id);
				}
			})
			.catch((error) => {
				Logger.warn("Error closing sessions:", error);
			});
	}, [appBuilderData, stableEmbeddedSessions]);

	// Create sessions that are not open yet. A resolve that clears its
	// result while loading must not close the sessions that remain listed.
	useEffect(() => {
		if (!sessionData?.length) return;
		const pending = sessionData.filter(
			(session) =>
				liveSlugsRef.current.get(session.id) !== sessionSlug(session),
		);
		if (!pending.length) return;

		promiseChainRef.current = promiseChainRef.current
			.then(async () => {
				const {createSession} = useShapeDiverStoreSession.getState();
				const {addSession, removeSession} =
					useShapeDiverStoreParameters.getState();
				for (const dto of pending) {
					const slug = sessionSlug(dto);
					const desired = desiredSessionsRef.current.find(
						(session) => session.id === dto.id,
					);
					if (!desired || sessionSlug(desired) !== slug) continue;
					if (liveSlugsRef.current.get(dto.id) === slug) continue;

					let api:
						| Awaited<ReturnType<typeof createSession>>
						| undefined;
					try {
						api = await createSession(
							{throwOnCustomizationError: true, ...dto},
							{
								onError: (error) =>
									Logger.warn(
										"Error creating sessions:",
										error,
									),
							},
							!dto.loadOnFirstUse,
						);
					} catch (error) {
						Logger.warn("Error creating sessions:", error);
						continue;
					}
					if (!api) continue;

					api.refreshJwtToken = dto.refreshJwtToken;
					const stillDesired = desiredSessionsRef.current.find(
						(session) => session.id === dto.id,
					);
					if (
						unmountedRef.current ||
						!stillDesired ||
						sessionSlug(stillDesired) !== slug
					) {
						if (!(await closeTrackedSession(api.id))) {
							if (!unmountedRef.current)
								liveSlugsRef.current.set(dto.id, slug);
							continue;
						}
						removeSession(api.id);
						continue;
					}

					liveSlugsRef.current.set(dto.id, slug);
					addSession(
						api,
						(dto.acceptRejectMode ?? api.parametersCommit) || false,
						eventTracking,
					);
				}
			})
			.catch((error) => {
				Logger.warn("Error creating sessions:", error);
			});
	}, [eventTracking, sessionData]);

	const loggedResolveErrorsRef = useRef<Set<string>>(new Set());

	useEffect(() => {
		setRetryResolve(resolveErrors.length > 0);
	}, [resolveErrors]);

	useEffect(() => {
		if (platformError)
			Logger.warn("Error resolving sessions:", platformError);
	}, [platformError]);

	useEffect(() => {
		const active = new Set<string>();
		for (const failure of resolveErrors) {
			const key = `${failure.id}:${String(failure.error)}`;
			active.add(key);
			if (loggedResolveErrorsRef.current.has(key)) continue;
			loggedResolveErrorsRef.current.add(key);
			Logger.warn(
				`Error resolving session "${failure.id}":`,
				failure.error,
			);
		}
		for (const key of loggedResolveErrorsRef.current) {
			if (!active.has(key)) loggedResolveErrorsRef.current.delete(key);
		}
	}, [resolveErrors]);

	useEffect(() => {
		return () => {
			unmountedRef.current = true;
			const ids = [...liveSlugsRef.current.keys()];
			promiseChainRef.current = promiseChainRef.current
				.then(async () => {
					const {removeSession} =
						useShapeDiverStoreParameters.getState();
					for (const id of ids) {
						if (!(await closeTrackedSession(id))) continue;
						removeSession(id);
					}
					liveSlugsRef.current.clear();
				})
				.catch((error) => {
					Logger.warn("Error closing sessions:", error);
				});
		};
	}, []);
}
