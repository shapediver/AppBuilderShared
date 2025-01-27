import {ISessionApi} from "@shapediver/viewer.session";
import {useEffect, useRef, useState} from "react";
import {IUseSessionDto} from "@AppBuilderShared/hooks/shapediver/useSession";
import {useShallow} from "zustand/react/shallow";
import {useEventTracking} from "@AppBuilderShared/hooks/useEventTracking";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";

/**
 * Hook for creating multiple sessions with ShapeDiver models using the ShapeDiver 3D Viewer.
 * Optionally registers all parameters and exports defined by the models as abstracted
 * parameters and exports for use by the UI components.
 *
 * @see {@link useShapeDiverStoreSession} to access the API of the session.
 * @see {@link useShapeDiverStoreParameters} to access the abstracted parameters and exports.
 *
 * @param props {@link IUseSessionDto}
 * @returns
 */
export function useSessions(props: IUseSessionDto[]) {
	const syncSessions = useShapeDiverStoreSession(
		(state) => state.syncSessions,
	);
	const {
		addSession: addSessionParameters,
		removeSession: removeSessionParameters,
	} = useShapeDiverStoreParameters(
		useShallow((state) => ({
			addSession: state.addSession,
			removeSession: state.removeSession,
		})),
	);
	const [sessionApis, setSessionApis] = useState<(ISessionApi | undefined)[]>(
		[],
	);
	const promiseChain = useRef(Promise.resolve());

	const errorReporting = useEventTracking();

	useEffect(() => {
		promiseChain.current = promiseChain.current.then(async () => {
			const apis = await syncSessions(props);
			setSessionApis(apis);

			apis.map((api, index) => {
				const dto = props[index];
				const {registerParametersAndExports = true} = dto;
				if (registerParametersAndExports && api) {
					/** execute changes immediately if the component is not running in accept/reject mode */
					addSessionParameters(
						api,
						// in case the session definition defines acceptRejectMode, use it
						// otherwise fall back to acceptRejectMode defined by the viewer settings
						dto.acceptRejectMode ?? api.commitParameters,
						dto.jwtToken,
						errorReporting,
					);
				}
			});
		});

		return () => {
			promiseChain.current = promiseChain.current.then(async () => {
				props.map((p) => {
					const {registerParametersAndExports = true} = p;
					if (registerParametersAndExports) {
						removeSessionParameters(p.id);
					}
				});
			});
		};
	}, [props]);

	return {
		sessionApis,
	};
}
