import { ISessionApi } from "@shapediver/viewer";
import { useEffect, useRef, useState } from "react";
import { useShapeDiverStoreViewer } from "../../store/useShapeDiverStoreViewer";
import { SessionCreateDto } from "../../types/store/shapediverStoreViewer";
import { useShapeDiverStoreParameters } from "../../store/useShapeDiverStoreParameters";
import { IAcceptRejectModeSelector } from "../../types/store/shapediverStoreParameters";
import { useShallow } from "zustand/react/shallow";
import { useErrorReporting } from "../useErrorReporting";

/**
 * DTO for use with {@link useSession} and {@link useSessions}. 
 * Extends {@link SessionCreateDto}. 
 */
export interface IUseSessionDto extends SessionCreateDto {
	/** 
	 * Set to true to register the session's parameters and exports as 
	 * abstracted parameters and exports managed by {@link useShapeDiverStoreParameters}. 
	 */
	registerParametersAndExports?: boolean;

	/**
	 * Set to true to require confirmation of the user to accept or reject changed parameter values.
	 * Set to false to disable this confirmation. 
	 * If undefined, the default stored for the model on the platform or in the model's viewer settings
	 * will be used.
	 */
	acceptRejectMode?: boolean | IAcceptRejectModeSelector;

	/**
	 * Optional callback for refreshing the JWT token.
	 */
	refreshJwtToken?: () => Promise<string>
}

/**
 * Hook for creating a session with a ShapeDiver model using the ShapeDiver 3D Viewer.
 * Optionally registers all parameters and exports defined by the model as abstracted 
 * parameters and exports for use by the UI components.
 * 
 * @see {@link useShapeDiverStoreViewer} to access the API of the session.
 * @see {@link useShapeDiverStoreParameters} to access the abstracted parameters and exports.
 *
 * @param props {@link IUseSessionDto}
 * @returns
 */
export function useSession(props: IUseSessionDto | undefined) {
	const { createSession, closeSession } = useShapeDiverStoreViewer(useShallow(state => ({ createSession: state.createSession, closeSession: state.closeSession })));
	const { addSession: addSessionParameters, removeSession: removeSessionParameters } = useShapeDiverStoreParameters(
		useShallow(state => ({ addSession: state.addSession, removeSession: state.removeSession }))
	);
	const [sessionApi, setSessionApi] = useState<ISessionApi | undefined>(undefined);
	const [error, setError] = useState<Error | undefined>(undefined);
	const promiseChain = useRef(Promise.resolve());

	const errorReporting = useErrorReporting();

	useEffect(() => {
		
		if (!props?.id) {
			return;
		}

		const { registerParametersAndExports = true, acceptRejectMode } = props;
	
		promiseChain.current = promiseChain.current.then(async () => {
			const api = await createSession({throwOnCustomizationError: true, ...props}, { onError: setError });
			if (api)
				api.refreshJwtToken = props.refreshJwtToken;
			setSessionApi(api);

			if (registerParametersAndExports && api) {
				addSessionParameters(
					api, 
					// in case the session definition defines acceptRejectMode, use it
					// otherwise fall back to acceptRejectMode defined by the viewer settings 
					acceptRejectMode ?? api.commitParameters, 
					props.jwtToken,
					errorReporting
				);
			}
		});

		return () => {
			promiseChain.current = promiseChain.current.then(async () => {
				await closeSession(props.id);

				if (registerParametersAndExports) {
					removeSessionParameters(props.id);
				}
			});
		};
	}, [props?.id]);

	return {
		sessionApi,
		error
	};
}
