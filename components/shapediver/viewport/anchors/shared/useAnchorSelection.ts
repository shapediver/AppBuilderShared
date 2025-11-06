import {useSelection} from "@AppBuilderShared/hooks/shapediver/viewer/interaction/selection/useSelection";
import {useShapeDiverStoreInteractionRequestManagement} from "@AppBuilderShared/store/useShapeDiverStoreInteractionRequestManagement";
import {ISelectionParameterProps} from "@shapediver/viewer.session";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";

export function useAnchorSelection(
	selectionProperties:
		| Omit<
				ISelectionParameterProps,
				| "minimumSelection"
				| "maximumSelection"
				| "deselectOnEmpty"
				| "prompt"
		  >
		| undefined,
	viewportId: string,
	showContent: boolean,
	aboveMobileBreakpoint: boolean,
	id: string,
	updateShowContent: (
		viewportId: string,
		anchorId: string,
		show: boolean,
	) => void,
) {
	const [selectionAllowed, setSelectionAllowed] = useState<boolean>(true);
	// reference to manage the interaction request token
	const interactionRequestTokenRef = useRef<string | undefined>(undefined);
	// get the interaction request management
	const {addInteractionRequest, removeInteractionRequest} =
		useShapeDiverStoreInteractionRequestManagement();
	/**
	 * Effect to manage the interaction request for the selection.
	 * It adds an interaction request when the selection is active and removes it when the selection is inactive.
	 * It also cleans up the interaction request when the component is unmounted or when the selection state changes.
	 */
	useEffect(() => {
		if (!!selectionProperties && !interactionRequestTokenRef.current) {
			const returnedToken = addInteractionRequest({
				type: "passive",
				viewportId,
				disable: () => {
					setSelectionAllowed(false);
				},
				enable: () => {
					setSelectionAllowed(true);
				},
			});
			interactionRequestTokenRef.current = returnedToken;
		} else if (!selectionProperties && interactionRequestTokenRef.current) {
			removeInteractionRequest(interactionRequestTokenRef.current);
			interactionRequestTokenRef.current = undefined;
		}

		return () => {
			if (interactionRequestTokenRef.current) {
				removeInteractionRequest(interactionRequestTokenRef.current);
				interactionRequestTokenRef.current = undefined;
			}
		};
	}, [selectionProperties]);

	const selectionActive = useMemo(() => {
		if (!selectionProperties) return false;

		return aboveMobileBreakpoint;
	}, [selectionProperties]);

	const cleanSelectionProps = useMemo(() => {
		return {
			...selectionProperties,
			minimumSelection: 0,
			maximumSelection: 1,
			deselectOnEmpty: true,
		};
	}, [selectionProperties]);

	const {selectedNodeNames} = useSelection(
		viewportId,
		cleanSelectionProps,
		selectionActive && selectionAllowed,
	);

	const updateShowContentCallback = useCallback(
		(selectedNodeNames: string[]) => {
			if (!selectionProperties) return;
			if (selectedNodeNames.length > 0 && !showContent) {
				updateShowContent(viewportId, id, true);
			} else if (selectedNodeNames.length === 0 && showContent) {
				updateShowContent(viewportId, id, false);
			}
		},
		[showContent, selectionProperties, viewportId, id, updateShowContent],
	);

	const updateShowContentCallbackRef = useRef(updateShowContentCallback);

	useEffect(() => {
		updateShowContentCallbackRef.current = updateShowContentCallback;
	}, [updateShowContentCallback]);

	useEffect(() => {
		updateShowContentCallbackRef.current(selectedNodeNames);
	}, [selectedNodeNames]);
}
