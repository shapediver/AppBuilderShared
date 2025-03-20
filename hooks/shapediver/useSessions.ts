import {IUseSessionDto} from "@AppBuilderShared/hooks/shapediver/useSession";
import {useEventTracking} from "@AppBuilderShared/hooks/useEventTracking";
import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {ISessionApi} from "@shapediver/viewer.session";
import {useEffect, useRef, useState} from "react";
import {useShallow} from "zustand/react/shallow";

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
	const [sessionApis, setSessionApis] = useState<(ISessionApi | undefined)[]>(
		[],
	);
	const [errors, setErrors] = useState<(Error | undefined)[]>([]);
	const promiseChain = useRef(Promise.resolve());

	const eventTracking = useEventTracking();

	useEffect(() => {
		promiseChain.current = promiseChain.current.then(async () => {
			const promises: Promise<ISessionApi | undefined>[] = [];

			// create a session for each session definition
			props.map((p, index) => {
				// create an error handler for the separate session
				const setError = (error: Error) => {
					const newErrors = [...errors];
					newErrors[index] = error;
					setErrors(newErrors);
				};

				promises.push(
					createSession(
						{throwOnCustomizationError: true, ...p},
						{onError: setError},
					),
				);
			});
			const apis = await Promise.all(promises);
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
						eventTracking,
					);
				}
			});
		});

		return () => {
			promiseChain.current = promiseChain.current.then(async () => {
				const promises: Promise<void>[] = [];

				// close each session
				props.map((p) => {
					// create an error handler for the separate session
					const setError = (error: Error) => {
						const newErrors = [...errors];
						newErrors[props.indexOf(p)] = error;
						setErrors(newErrors);
					};

					promises.push(closeSession(p.id, {onError: setError}));
				});
				await Promise.all(promises);

				setSessionApis([]);
				setErrors([]);
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
		errors,
	};
}
