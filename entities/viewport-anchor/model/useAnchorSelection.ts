import {useSelection} from "@AppBuilderLib/entities/parameter/model/interaction/useSelection";
import {useShapeDiverStoreInteractionRequestManagement} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreInteractionRequestManagement";
import {useShapeDiverStoreProcessManager} from "@AppBuilderLib/shared/model/useShapeDiverStoreProcessManager";
import {ISelectionParameterProps} from "@shapediver/viewer.session";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";

const selectedNodeNamesCache: {[key: string]: string[]} = {};

const getAllAvailableNames = (availableNodeNames: {
	[key: string]: {[key: string]: string[]};
}) =>
	Object.values(availableNodeNames).flatMap((perOutput) =>
		Object.values(perOutput).flat(),
	);

const getValidCachedNames = (
	cachedNames: string[] | undefined,
	availableNodeNames: {[key: string]: {[key: string]: string[]}},
) => {
	if (!cachedNames || cachedNames.length === 0) return [];
	const availableNames = getAllAvailableNames(availableNodeNames);
	if (availableNames.length === 0) return cachedNames;
	return cachedNames.filter((name) => availableNames.includes(name));
};

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
	const cacheKey = `${viewportId}-${id}`;
	// reference to manage the interaction request token
	const interactionRequestTokenRef = useRef<string | undefined>(undefined);
	// get the interaction request management
	const {addInteractionRequest, removeInteractionRequest} =
		useShapeDiverStoreInteractionRequestManagement();

	const processActive = useShapeDiverStoreProcessManager(
		(state) => Object.values(state.processManagers).length > 0,
	);
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

	const cleanSelectionProps = useMemo(() => {
		return {
			...selectionProperties,
			minimumSelection: 0,
			maximumSelection: 1,
			deselectOnEmpty: true,
		};
	}, [selectionProperties]);

	const {
		selectedNodeNames,
		setSelectedNodeNamesAndRestoreSelection,
		availableNodeNames,
	} = useSelection(
		viewportId,
		cleanSelectionProps,
		!!selectionProperties && selectionAllowed,
		selectedNodeNamesCache[cacheKey] || [],
	);

	/**
	 * Effect to restore the selected node names from the cache when the viewportId or id changes.
	 * This ensures that the selection is preserved when the hook reloads.
	 */
	useEffect(() => {
		const cachedNames = selectedNodeNamesCache[cacheKey] || [];
		const validCachedNames = getValidCachedNames(
			cachedNames,
			availableNodeNames,
		);
		if (!selectionProperties || !selectionAllowed) return;
		if (validCachedNames.length !== cachedNames.length)
			selectedNodeNamesCache[cacheKey] = validCachedNames;
		setSelectedNodeNamesAndRestoreSelection(validCachedNames);
	}, [
		viewportId,
		id,
		selectionProperties,
		selectionAllowed,
		cacheKey,
		availableNodeNames,
	]);

	const updateShowContentCallback = useCallback(
		(selectedNodeNames: string[]) => {
			if (!selectionProperties) return;
			if (processActive) return;
			if (selectedNodeNames.length > 0 && !showContent) {
				updateShowContent(viewportId, id, true);
			} else if (selectedNodeNames.length === 0 && showContent) {
				updateShowContent(viewportId, id, false);
			}
		},
		[
			showContent,
			selectionProperties,
			viewportId,
			id,
			updateShowContent,
			processActive,
		],
	);

	const updateShowContentCallbackRef = useRef(updateShowContentCallback);

	useEffect(() => {
		updateShowContentCallbackRef.current = updateShowContentCallback;
	}, [updateShowContentCallback]);

	useEffect(() => {
		if (selectedNodeNames.length > 0) {
			selectedNodeNamesCache[cacheKey] = selectedNodeNames;
		} else {
			const hasAvailableNames =
				getAllAvailableNames(availableNodeNames).length > 0;
			if (!processActive && hasAvailableNames) {
				selectedNodeNamesCache[cacheKey] = [];
			}
		}
		updateShowContentCallbackRef.current(selectedNodeNames);
	}, [selectedNodeNames, cacheKey, availableNodeNames, processActive]);

	/**
	 * Effect to re-select cached nodes and flush visibility when a computation
	 * finishes (processActive transitions from true to false).
	 * During computation, updateShowContentCallback is gated by processActive,
	 * so the visibility update and selection restoration are deferred.
	 * This effect catches the transition and re-applies them.
	 */
	const prevProcessActiveRef = useRef(processActive);
	useEffect(() => {
		const wasActive = prevProcessActiveRef.current;
		prevProcessActiveRef.current = processActive;

		if (!selectionProperties) return;
		if (wasActive && !processActive) {
			const cachedNames = selectedNodeNamesCache[cacheKey];
			const validCachedNames = getValidCachedNames(
				cachedNames,
				availableNodeNames,
			);
			selectedNodeNamesCache[cacheKey] = validCachedNames;
			if (validCachedNames.length > 0) {
				setSelectedNodeNamesAndRestoreSelection(validCachedNames);
			}
			updateShowContentCallbackRef.current(selectedNodeNames);
		}
	}, [
		processActive,
		selectionProperties,
		cacheKey,
		selectedNodeNames,
		availableNodeNames,
	]);

	useEffect(() => {
		return () => {
			delete selectedNodeNamesCache[cacheKey];
		};
	}, [cacheKey]);
}
