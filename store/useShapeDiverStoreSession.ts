import {devtoolsSettings} from "@AppBuilderShared/store/storeSettings";
import {
	IShapeDiverStoreSession,
	SessionCreateDto,
	UpdateCallbackType,
} from "@AppBuilderShared/types/store/shapediverStoreSession";
import {ShapeDiverResponseErrorType} from "@shapediver/api.geometry-api-dto-v2";
import {
	createSession,
	IOutputApi,
	ISessionApi,
	isViewerGeometryBackendResponseError,
} from "@shapediver/viewer.session";
import {create} from "zustand";
import {devtools} from "zustand/middleware";

/**
 * Helper for comparing sessions.
 */
type ISessionCompare = {id: string; identifier: string; dto?: SessionCreateDto};

/**
 * Helper for comparing sessions.
 */
const createSessionIdentifier = function (
	parameters: Pick<SessionCreateDto, "id">,
) {
	return JSON.stringify({
		id: parameters.id,
	});
};

/**
 * Store data related to the ShapeDiver 3D Viewer Session.
 * @see {@link IShapeDiverStoreSession}
 */
export const useShapeDiverStoreSession = create<IShapeDiverStoreSession>()(
	devtools(
		(set, get) => ({
			sessions: {},

			createSession: async (dto: SessionCreateDto, callbacks) => {
				// in case a session with the same identifier exists, skip creating a new one
				const identifier = createSessionIdentifier(dto);
				const {sessions} = get();
				if (
					Object.values(sessions).findIndex(
						(s) => identifier === createSessionIdentifier(s),
					) >= 0
				)
					return;

				let session: ISessionApi | undefined = undefined;
				try {
					try {
						session = await createSession(dto);
					} catch (e: any) {
						if (
							isViewerGeometryBackendResponseError(e) &&
							e.geometryBackendErrorType ===
								ShapeDiverResponseErrorType.REQUEST_VALIDATION_ERROR &&
							e.message.startsWith("Invalid parameter") &&
							e.message.includes("'context'")
						) {
							console.warn(
								"Session creation failed due to invalid or missing 'context' parameter. Retrying without 'context' parameter.",
							);

							const dtoWithoutContext: SessionCreateDto = {
								...dto,
								initialParameterValues: {
									...dto.initialParameterValues,
								},
							};
							delete dtoWithoutContext.initialParameterValues![
								"context"
							];
							session = await createSession(dtoWithoutContext);
						} else {
							throw e;
						}
					}
				} catch (e: any) {
					callbacks?.onError(e);
				}

				set(
					(state) => {
						return {
							sessions: {
								...state.sessions,
								...(session ? {[session.id]: session} : {}),
							},
						};
					},
					false,
					"createSession",
				);

				return session;
			},

			closeSession: async (sessionId, callbacks) => {
				const {sessions} = get();
				const session = sessions[sessionId];
				if (!session) return;

				try {
					await session.close();
				} catch (e) {
					callbacks?.onError(e);

					return;
				}

				return set(
					(state) => {
						// create a new object, omitting the session which was closed
						const newSessions: {[id: string]: ISessionApi} = {};
						Object.keys(state.sessions).forEach((id) => {
							if (id !== sessionId)
								newSessions[id] = state.sessions[id];
						});

						return {
							sessions: newSessions,
						};
					},
					false,
					"closeSession",
				);
			},

			syncSessions: async (
				sessionDtos: SessionCreateDto[],
				callbacks,
			): Promise<(ISessionApi | undefined)[]> => {
				const {sessions, createSession, closeSession} = get();
				// Helps to skip typescript filter error
				const isSession = (
					session: ISessionCompare | undefined,
				): session is ISessionCompare => !!session;
				// Get existing sessions
				const existingSessionData: ISessionCompare[] = Object.values(
					sessions,
				)
					.map((session) =>
						session
							? {
									id: session.id,
									identifier:
										createSessionIdentifier(session),
								}
							: undefined,
					)
					.filter(isSession);
				// Convert SessionCreateDto[] to the ISessionCompare[]
				const requestedSessionData = sessionDtos.map((sessionDto) => ({
					id: sessionDto.id,
					identifier: createSessionIdentifier(sessionDto),
					data: sessionDto,
				}));
				// Find sessions to delete
				const sessionsToDelete = existingSessionData.filter(
					(sessionCompareExist) => {
						return (
							requestedSessionData.findIndex(
								(sessionCompareNew) => {
									return (
										sessionCompareNew.identifier ===
										sessionCompareExist.identifier
									);
								},
							) === -1
						);
					},
				);

				// Find sessions to create
				const sessionsToCreate = requestedSessionData.filter(
					(sessionCompareNew) => {
						return (
							existingSessionData.findIndex(
								(sessionCompareExist) =>
									sessionCompareExist.identifier ===
									sessionCompareNew.identifier,
							) === -1
						);
					},
				);

				// promises
				const sessionsToDeletePromises = sessionsToDelete.map(
					(sessionToDelete) => closeSession(sessionToDelete.id),
				);
				const sessionsToCreatePromise = sessionsToCreate.map(
					(sessionDataNew) =>
						createSession(sessionDataNew.data, callbacks),
				);

				await Promise.all([
					...sessionsToDeletePromises,
					...sessionsToCreatePromise,
				]);

				const sessionApis = get().sessions;

				return sessionDtos.map((dto) => sessionApis[dto.id]);
			},

			sessionUpdateCallbacks: {},

			addSessionUpdateCallback(sessionId, updateCallback) {
				if (!sessionId || !updateCallback) return () => {};
				const {sessions} = get();

				// get the session
				const session = sessions[sessionId];
				if (session) {
					// call the callback once
					updateCallback(session.node, undefined);
					// we don't abort here as the callback might be registered before any session is loaded
				}

				// generate a random callback id for the removal
				const callbackId = Math.random().toString(36).substring(7);

				set((state) => {
					// create a new object
					const newSessionUpdateCallbacks = {
						...state.sessionUpdateCallbacks,
					};

					if (!newSessionUpdateCallbacks[sessionId])
						newSessionUpdateCallbacks[sessionId] = {};

					// add the callback to the session
					newSessionUpdateCallbacks[sessionId] = {
						...newSessionUpdateCallbacks[sessionId],
						[callbackId]: updateCallback,
					};

					return {sessionUpdateCallbacks: newSessionUpdateCallbacks};
				});

				/**
				 * Return a function to remove the callback.
				 * This will remove the callback from the updateCallbacks object.
				 */
				return () => {
					if (!sessionId || !callbackId) return;
					const {sessions, sessionUpdateCallbacks} = get();

					// get the session
					const session = sessions[sessionId];

					const sessionUpdateCallbacksForSession =
						sessionUpdateCallbacks[sessionId]?.[callbackId];
					if (session && sessionUpdateCallbacksForSession) {
						// if the session exists, call the callback once with the node as the old node
						// like this, cleanup can be done in the callback
						sessionUpdateCallbacksForSession(
							undefined,
							session.node,
						);
					}

					set((state) => {
						const newSessionUpdateCallbacks = {
							...state.sessionUpdateCallbacks,
						};

						// if the session or the callback doesn't exist, return
						if (
							!newSessionUpdateCallbacks[sessionId] ||
							!newSessionUpdateCallbacks[sessionId][callbackId]
						) {
							return {}; // No changes needed
						}

						newSessionUpdateCallbacks[sessionId] = {
							...newSessionUpdateCallbacks[sessionId],
						};

						delete newSessionUpdateCallbacks[sessionId][callbackId];

						// Clean up empty objects
						if (
							Object.keys(newSessionUpdateCallbacks[sessionId])
								.length === 0
						) {
							delete newSessionUpdateCallbacks[sessionId];
						}

						return {
							sessionUpdateCallbacks: newSessionUpdateCallbacks,
						};
					}, false);
				};
			},

			outputUpdateCallbacks: {},

			addOutputUpdateCallback(sessionId, outputId, updateCallback) {
				if (!sessionId || !outputId || !updateCallback) return () => {};
				const {sessions} = get();

				// get the session
				const session = sessions[sessionId];
				// get the output
				const output = session?.outputs[outputId];
				if (output) {
					// call the callback once
					updateCallback(output.node, undefined);
					// we don't abort here as the callback might be registered before any session is loaded
				}

				// generate a random callback id for the removal
				const callbackId = Math.random().toString(36).substring(7);

				set((state) => {
					// create a new object
					const newOutputUpdateCallbacks = {
						...state.outputUpdateCallbacks,
					};

					if (!newOutputUpdateCallbacks[sessionId])
						newOutputUpdateCallbacks[sessionId] = {};
					if (!newOutputUpdateCallbacks[sessionId][outputId])
						newOutputUpdateCallbacks[sessionId][outputId] = {};

					newOutputUpdateCallbacks[sessionId][outputId] = {
						...newOutputUpdateCallbacks[sessionId][outputId],
						[callbackId]: updateCallback,
					};

					return {outputUpdateCallbacks: newOutputUpdateCallbacks};
				});

				return () => {
					if (!sessionId || !outputId || !callbackId) return;
					const {sessions, outputUpdateCallbacks} = get();

					// get the session
					const session = sessions[sessionId];
					// get the output
					const output = session?.outputs[outputId];

					const outputUpdateCallbacksForOutput =
						outputUpdateCallbacks[sessionId]?.[outputId]?.[
							callbackId
						];
					if (output && outputUpdateCallbacksForOutput) {
						// call the callback once with the old node
						// like this, cleanup can be done in the callback
						outputUpdateCallbacksForOutput(undefined, output.node);
					}

					set((state) => {
						const newOutputUpdateCallbacks = {
							...state.outputUpdateCallbacks,
						};

						if (
							!newOutputUpdateCallbacks[sessionId] ||
							!newOutputUpdateCallbacks[sessionId][outputId] ||
							!newOutputUpdateCallbacks[sessionId][outputId][
								callbackId
							]
						) {
							return {}; // No changes needed
						}

						// this needs to be done like this to avoid the mutation of the state
						newOutputUpdateCallbacks[sessionId] = {
							...newOutputUpdateCallbacks[sessionId],
						};
						// this needs to be done like this to avoid the mutation of the state
						newOutputUpdateCallbacks[sessionId][outputId] = {
							...newOutputUpdateCallbacks[sessionId][outputId],
						};

						delete newOutputUpdateCallbacks[sessionId][outputId][
							callbackId
						];

						// Clean up empty objects
						if (
							Object.keys(
								newOutputUpdateCallbacks[sessionId][outputId],
							).length === 0
						) {
							delete newOutputUpdateCallbacks[sessionId][
								outputId
							];
						}

						// Clean up empty objects
						if (
							Object.keys(newOutputUpdateCallbacks[sessionId])
								.length === 0
						) {
							delete newOutputUpdateCallbacks[sessionId];
						}

						return {
							outputUpdateCallbacks: newOutputUpdateCallbacks,
						};
					}, false);
				};
			},
		}),
		{...devtoolsSettings, name: "ShapeDiver | Viewer"},
	),
);

/**
 * Assign the session update callback to the session.
 * @param sessionApi
 * @param callbacks
 */
const assignSessionUpdateCallback = (
	sessionApi: ISessionApi,
	callbacks: {
		// callback id
		[key: string]: UpdateCallbackType;
	},
) => {
	sessionApi.updateCallback = async (newNode, oldNode) => {
		await Promise.all(
			Object.values(callbacks).map((cb) => cb(newNode, oldNode)),
		);
	};
};

/**
 * Assign the output update callback to the output.
 *
 * @param outputApi
 * @param outputUpdateCallbacks
 */
const assignOutputUpdateCallback = (
	outputApi: IOutputApi,
	outputUpdateCallbacks: {
		// callback id
		[key: string]: UpdateCallbackType;
	},
) => {
	outputApi.updateCallback = async (newNode, oldNode) => {
		await Promise.all(
			Object.values(outputUpdateCallbacks).map((cb) =>
				cb(newNode, oldNode),
			),
		);
	};
};

/**
 * Subscribe to the store and update the sessions and outputs.
 * Like this, the callbacks are assigned to the sessions and outputs.
 * If the session or output is not available, the callback is not assigned.
 *
 * In the first step we check which sessions or outputs need to be updated.
 * Like this, we can avoid unnecessary updates.
 *
 * In the second step we update the sessions and outputs.
 */
useShapeDiverStoreSession.subscribe((state, prevState) => {
	const sessionsThatNeedUpdate: string[] = [];
	const outputsThatNeedUpdate: {
		sessionId: string;
		outputId: string;
	}[] = [];

	if (state.sessions !== prevState.sessions) {
		// get the sessions that were not in the previous state
		Object.keys(state.sessions).forEach((sessionId) => {
			if (!prevState.sessions[sessionId]) {
				sessionsThatNeedUpdate.push(sessionId);
				// as a session is new, all outputs need to be updated
				for (const outputId in state.sessions[sessionId].outputs) {
					outputsThatNeedUpdate.push({sessionId, outputId});
				}
			}
		});
	}

	if (state.sessionUpdateCallbacks !== prevState.sessionUpdateCallbacks) {
		// get the session update callbacks where the new value is not the same as the previous value
		Object.keys(state.sessionUpdateCallbacks).forEach((sessionId) => {
			if (
				state.sessionUpdateCallbacks[sessionId] !==
				prevState.sessionUpdateCallbacks[sessionId]
			) {
				sessionsThatNeedUpdate.push(sessionId);
			}
		});
	}

	if (state.outputUpdateCallbacks !== prevState.outputUpdateCallbacks) {
		// get the output update callbacks where the new value is not the same as the previous value
		Object.keys(state.outputUpdateCallbacks).forEach((sessionId) => {
			Object.keys(state.outputUpdateCallbacks[sessionId]).forEach(
				(outputId) => {
					if (
						!prevState.outputUpdateCallbacks[sessionId] ||
						!prevState.outputUpdateCallbacks[sessionId][outputId] ||
						state.outputUpdateCallbacks[sessionId][outputId] !==
							prevState.outputUpdateCallbacks[sessionId][outputId]
					) {
						outputsThatNeedUpdate.push({sessionId, outputId});
					}
				},
			);
		});
	}

	// update the sessions
	sessionsThatNeedUpdate.forEach((sessionId) => {
		const session = state.sessions[sessionId];
		if (!session || !state.sessionUpdateCallbacks[sessionId]) return;

		assignSessionUpdateCallback(
			session,
			state.sessionUpdateCallbacks[sessionId],
		);
	});

	// update the outputs
	outputsThatNeedUpdate.forEach(({sessionId, outputId}) => {
		const session = state.sessions[sessionId];
		if (!session) return;

		const output = session.outputs[outputId];
		if (!output) return;

		if (
			!state.outputUpdateCallbacks[sessionId] ||
			!state.outputUpdateCallbacks[sessionId][outputId]
		)
			return;

		assignOutputUpdateCallback(
			output,
			state.outputUpdateCallbacks[sessionId][outputId],
		);
	});
});
