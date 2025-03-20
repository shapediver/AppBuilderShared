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
					// if there was a session update callback registered, call it once with the old node
					if (session.updateCallback)
						await session.updateCallback(undefined, session.node);

					// for all outputs, call the output update callback once with the old node
					for (const outputId in session.outputs) {
						const output = session.outputs[outputId];
						if (output.updateCallback)
							await output.updateCallback(undefined, output.node);
					}

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
	let sessionsThatNeedUpdate: string[] = [];
	let outputsThatNeedUpdate: {
		sessionId: string;
		outputId: string;
	}[] = [];

	/**
	 * Here we check if the session themselves changed.
	 * If a session is new or changed, we need to update the session update callback.
	 * The outputs need to be updated as well.
	 */
	if (state.sessions !== prevState.sessions) {
		Object.keys(state.sessions).forEach((sessionId) => {
			// case 1: the session is new
			if (!prevState.sessions[sessionId]) {
				sessionsThatNeedUpdate.push(sessionId);
				// as a session is new, all outputs need to be updated
				for (const outputId in state.sessions[sessionId].outputs) {
					outputsThatNeedUpdate.push({sessionId, outputId});
				}
			}

			// case 2: the session is removed
			// in this case we don't need to update the session update callback of the
			// session as the session doesn't exist anymore

			// case 3: the session is changed
			if (state.sessions[sessionId] !== prevState.sessions[sessionId]) {
				sessionsThatNeedUpdate.push(sessionId);
				// as a session is new, all outputs need to be updated
				for (const outputId in state.sessions[sessionId].outputs) {
					outputsThatNeedUpdate.push({sessionId, outputId});
				}
			}
		});
	}

	/**
	 * Here we check if the session update callbacks changed.
	 * If a session update callback is new, removed or changed, we need to update the session update callback.
	 */
	if (state.sessionUpdateCallbacks !== prevState.sessionUpdateCallbacks) {
		// get all session ids that are in the current or previous state
		const combinedIds = Object.keys(state.sessions).concat(
			Object.keys(prevState.sessions),
		);

		Object.keys(combinedIds).forEach((sessionId) => {
			// case 1: the update callback is new
			// it's not in the previous state
			if (!prevState.sessionUpdateCallbacks[sessionId]) {
				sessionsThatNeedUpdate.push(sessionId);
			}

			// case 2: the update callback is removed
			// it's not in the current state
			if (!state.sessionUpdateCallbacks[sessionId]) {
				sessionsThatNeedUpdate.push(sessionId);
			}

			// case 3: the update callback is changed
			if (
				state.sessionUpdateCallbacks[sessionId] !==
				prevState.sessionUpdateCallbacks[sessionId]
			) {
				sessionsThatNeedUpdate.push(sessionId);
			}
		});
	}

	/**
	 * Here we check if the output update callbacks changed.
	 * If an output update callback is new, removed or changed, we need to update the output update callback.
	 */
	if (state.outputUpdateCallbacks !== prevState.outputUpdateCallbacks) {
		// get all output ids that are in the current or previous state
		const combinedIds: {
			[key: string]: string[];
		} = {};

		// get all output ids of the current state
		for (const sessionId in state.outputUpdateCallbacks) {
			combinedIds[sessionId] = Object.keys(
				state.outputUpdateCallbacks[sessionId],
			);
		}

		// add all output ids of the previous state
		for (const sessionId in prevState.outputUpdateCallbacks) {
			if (!combinedIds[sessionId]) {
				combinedIds[sessionId] = Object.keys(
					prevState.outputUpdateCallbacks[sessionId],
				);
			} else {
				combinedIds[sessionId] = combinedIds[sessionId].concat(
					Object.keys(prevState.outputUpdateCallbacks[sessionId]),
				);
			}
		}

		// get the output update callbacks where the new value is not the same as the previous value
		Object.keys(combinedIds).forEach((sessionId) => {
			Object.keys(combinedIds[sessionId]).forEach((outputId) => {
				// case 1: the output update callback is new
				// it's not in the previous state
				if (
					!prevState.outputUpdateCallbacks[sessionId] ||
					!prevState.outputUpdateCallbacks[sessionId][outputId]
				) {
					outputsThatNeedUpdate.push({sessionId, outputId});
				}

				// case 2: the output update callback is removed
				// it's not in the current state
				if (
					!state.outputUpdateCallbacks[sessionId] &&
					!state.outputUpdateCallbacks[sessionId][outputId]
				) {
					outputsThatNeedUpdate.push({sessionId, outputId});
				}

				// case 3: the output update callback is changed
				// it exists in both states but the value is different
				if (
					state.outputUpdateCallbacks[sessionId] &&
					prevState.outputUpdateCallbacks[sessionId] &&
					state.outputUpdateCallbacks[sessionId][outputId] &&
					prevState.outputUpdateCallbacks[sessionId][outputId] &&
					state.outputUpdateCallbacks[sessionId][outputId] !==
						prevState.outputUpdateCallbacks[sessionId][outputId]
				) {
					outputsThatNeedUpdate.push({sessionId, outputId});
				}
			});
		});
	}

	// remove duplicates from sessions that need update
	sessionsThatNeedUpdate = sessionsThatNeedUpdate.filter(
		(value, index, self) => self.indexOf(value) === index,
	);
	// remove duplicates from outputs that need update
	outputsThatNeedUpdate = outputsThatNeedUpdate.filter(
		(value, index, self) =>
			self.findIndex(
				(item) =>
					item.sessionId === value.sessionId &&
					item.outputId === value.outputId,
			) === index,
	);

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

	// in the end, we check for new sessions and call the update callback once
	// this is done to ensure that the initial state is set correctly
	const newSessions = Object.values(state.sessions).filter(
		(session) => !prevState.sessions[session.id],
	);

	newSessions.forEach((session) => {
		if (!session.updateCallback) return;

		// call the callback once
		session.updateCallback(session.node, undefined);

		// for all outputs, call the output update callback once
		for (const outputId in session.outputs) {
			const output = session.outputs[outputId];
			if (!output.updateCallback) continue;

			output.updateCallback(output.node, undefined);
		}
	});
});
