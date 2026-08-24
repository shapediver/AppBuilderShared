import {useShapeDiverStoreInteractionRequestManagement} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreInteractionRequestManagement";
import {useCallback, useEffect, useRef} from "react";

interface UseInteractionRequestLifecycleOptions {
	viewportId: string;
	active: boolean;
	persistent?: boolean;
	onDisable: () => void;
	onSuspend?: () => void;
	onResume?: () => void;
	setDisableOtherParameters: (disabled: boolean) => void;
}

/**
 * Registers an interaction with the shared request manager.
 * Persistent interactions use passive requests so they can suspend and resume
 * around an exclusive active interaction; all others use active requests.
 */
export const useInteractionRequestLifecycle = ({
	viewportId,
	active,
	persistent = false,
	onDisable,
	onSuspend,
	onResume,
	setDisableOtherParameters,
}: UseInteractionRequestLifecycleOptions) => {
	const {
		activatePassiveInteraction,
		addInteractionRequest,
		removeInteractionRequest,
	} =
		useShapeDiverStoreInteractionRequestManagement();
	const tokenRef = useRef<string>();
	const callbacksRef = useRef({
		onDisable,
		onResume,
		onSuspend,
		setDisableOtherParameters,
	});
	callbacksRef.current = {
		onDisable,
		onResume,
		onSuspend,
		setDisableOtherParameters,
	};

	const releaseInteraction = useCallback(() => {
		callbacksRef.current.setDisableOtherParameters(false);
		if (tokenRef.current) {
			removeInteractionRequest(tokenRef.current);
			tokenRef.current = undefined;
		}
	}, [removeInteractionRequest]);
	const takeOverInteraction = useCallback(() => {
		if (persistent && tokenRef.current) {
			activatePassiveInteraction(tokenRef.current);
		}
	}, [activatePassiveInteraction, persistent]);

	useEffect(() => {
		callbacksRef.current.setDisableOtherParameters(!persistent && active);

		if (active && !tokenRef.current) {
				tokenRef.current = addInteractionRequest(
					persistent
						? {
							type: "passive",
							viewportId,
							disable: () =>
								callbacksRef.current.onSuspend?.() ??
								callbacksRef.current.onDisable(),
							enable: () =>
								callbacksRef.current.onResume?.(),
						}
						: {
								type: "active",
								viewportId,
								disable: () =>
									callbacksRef.current.onDisable(),
							},
			);
		} else if (!active && tokenRef.current) {
			releaseInteraction();
		}

		return () => {
			releaseInteraction();
		};
	}, [
		active,
		addInteractionRequest,
		persistent,
		releaseInteraction,
		viewportId,
	]);

	return {releaseInteraction, takeOverInteraction};
};
