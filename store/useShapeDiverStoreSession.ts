import {
	createSession,
	ISessionApi,
	isViewerGeometryBackendResponseError,
} from "@shapediver/viewer.session";
import {create} from "zustand";
import {devtools} from "zustand/middleware";
import {ShapeDiverResponseErrorType} from "@shapediver/api.geometry-api-dto-v2";
import {
	SessionCreateDto,
	IShapeDiverStoreSession,
} from "@AppBuilderShared/types/store/shapediverStoreSession";
import {devtoolsSettings} from "@AppBuilderShared/store/storeSettings";

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
		}),
		{...devtoolsSettings, name: "ShapeDiver | Viewer"},
	),
);
