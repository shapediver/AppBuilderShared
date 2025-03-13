import {useEventTracking} from "@AppBuilderShared/hooks/useEventTracking";
import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {IAcceptRejectModeSelector} from "@AppBuilderShared/types/store/shapediverStoreParameters";
import {SessionCreateDto} from "@AppBuilderShared/types/store/shapediverStoreSession";
import {ISessionApi} from "@shapediver/viewer.session";
import {useEffect, useRef, useState} from "react";
import {useShallow} from "zustand/react/shallow";

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
	refreshJwtToken?: () => Promise<string>;
}

/**
 * Hook for creating a session with a ShapeDiver model using the ShapeDiver 3D Viewer.
 * Optionally registers all parameters and exports defined by the model as abstracted
 * parameters and exports for use by the UI components.
 *
 * @see {@link useShapeDiverStoreSession} to access the API of the session.
 * @see {@link useShapeDiverStoreParameters} to access the abstracted parameters and exports.
 *
 * @param props {@link IUseSessionDto}
 * @returns
 */
export function useSession(props: IUseSessionDto | undefined) {
	const {createSession, closeSession} = useShapeDiverStoreSession(
		useShallow((state) => ({
			createSession: state.createSession,
			closeSession: state.closeSession,
		})),
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
	const [sessionApi, setSessionApi] = useState<ISessionApi | undefined>(
		undefined,
	);
	const [error, setError] = useState<Error | undefined>(undefined);
	const promiseChain = useRef(Promise.resolve());

	const eventTracking = useEventTracking();

	useEffect(() => {
		if (!props?.id) {
			return;
		}

		const {registerParametersAndExports = true, acceptRejectMode} = props;

		promiseChain.current = promiseChain.current.then(async () => {
			const api = await createSession(
				{throwOnCustomizationError: true, ...props},
				{onError: setError},
			);
			if (api) api.refreshJwtToken = props.refreshJwtToken;
			setSessionApi(api);

			if (registerParametersAndExports && api) {
				addSessionParameters(
					api,
					// in case the session definition defines acceptRejectMode, use it
					// otherwise fall back to acceptRejectMode defined by the viewer settings
					acceptRejectMode ?? api.commitParameters,
					props.jwtToken,
					eventTracking,
				);
			}
		});

		return () => {
			promiseChain.current = promiseChain.current.then(async () => {
				await closeSession(props.id);
				setSessionApi(undefined);
				setError(undefined);

				if (registerParametersAndExports) {
					removeSessionParameters(props.id);
				}
			});
		};
	}, [props?.id]);

	return {
		sessionApi,
		error,
	};
}
