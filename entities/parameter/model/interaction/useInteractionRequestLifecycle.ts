import {useShapeDiverStoreInteractionRequestManagement} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreInteractionRequestManagement";
import {useEffect, useRef} from "react";

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
	const {addInteractionRequest, removeInteractionRequest} =
		useShapeDiverStoreInteractionRequestManagement();
	const tokenRef = useRef<string>();

	useEffect(() => {
		setDisableOtherParameters(!persistent && active);

		if (active && !tokenRef.current) {
			tokenRef.current = addInteractionRequest(
				persistent
					? {
							type: "passive",
							viewportId,
							disable: onSuspend ?? onDisable,
							enable: onResume ?? (() => undefined),
						}
					: {type: "active", viewportId, disable: onDisable},
			);
		} else if (!active && tokenRef.current) {
			removeInteractionRequest(tokenRef.current);
			tokenRef.current = undefined;
		}

		return () => {
			setDisableOtherParameters(false);
			if (tokenRef.current) {
				removeInteractionRequest(tokenRef.current);
				tokenRef.current = undefined;
			}
		};
	}, [
		active,
		addInteractionRequest,
		onDisable,
		onResume,
		onSuspend,
		persistent,
		removeInteractionRequest,
		setDisableOtherParameters,
		viewportId,
	]);
};
