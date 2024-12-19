import { useCallback, useEffect, useMemo, useRef } from "react";
import { Gumball, updateGumballTransformation } from "@shapediver/viewer.features.gumball";
import { getNodesByName } from "@shapediver/viewer.features.interaction";
import { IGumballParameterProps, ISelectionParameterProps } from "@shapediver/viewer.session";
import { useShapeDiverStoreSession } from "shared/store/useShapeDiverStoreSession";
import { useShapeDiverStoreViewport } from "shared/store/useShapeDiverStoreViewport";
import { useSelection } from "../selection/useSelection";
import { useGumballEvents } from "./useGumballEvents";
import { mat4 } from "gl-matrix";

// #region Functions (1)

export interface IGumballState {
	/**
	 * The transformed node names.
	 */
	transformedNodeNames: {
		name: string,
		transformation: number[],
		localTransformations?: number[]
	}[],
	/**
	 * Set the transformed node names.
	 * 
	 * @param nodes 
	 * @returns 
	 */
	setTransformedNodeNames: (nodes: { name: string, transformation: number[], localTransformations?: number[] }[]) => void,
	/**
	 * The selected node names.
	 */
	selectedNodeNames: string[],
	/**
	 * Set the selected node names.
	 * 
	 * @param selectedNodes 
	 * @returns 
	 */
	setSelectedNodeNames: (selectedNodes: string[]) => void,
	/**
	 * Restore the transformed node names.
	 * 
	 * @param newTransformedNodeNames 
	 * @param oldTransformedNodeNames 
	 * @returns 
	 */
	restoreTransformedNodeNames: (newTransformedNodeNames: { name: string, transformation: number[], localTransformations?: number[] }[], oldTransformedNodeNames: { name: string }[]) => void,
	/**
	 * The handlers to be added to the document.
	 */
	handlers: JSX.Element[]
}

/**
 * Hook providing stateful gumball interaction for a viewport and session.
 * This wraps lower level hooks for the selection and gumball events.
 * 
 * @param sessionIds IDs of the sessions for which the gumball shall be created.
 * @param viewportId ID of the viewport for which the gumball shall be created.
 * @param gumballProps Parameter properties to be used. This includes name filters, and properties for the behavior of the gumball.
 * @param activate Set this to true to activate the gumball. If false, preparations are made but no gumball is possible.
 * @param initialTransformedNodeNames The initial transformed node names (used to initialize the selection state).
 * 					Note that this initial state is not checked against the filter pattern.
 */
export function useGumball(
	sessionIds: string[], 
	viewportId: string, 
	gumballProps: IGumballParameterProps,
	activate: boolean,
	initialTransformedNodeNames?: { name: string, transformation: number[] }[],
	strictNaming = true
): IGumballState {
	// get the session API
	const sessionApis = useShapeDiverStoreSession(state => { return sessionIds.map(id => state.sessions[id]); });
	// get the viewport API
	const viewportApi = useShapeDiverStoreViewport(state => { return state.viewports[viewportId]; });
	
	// create the selection settings from the interaction settings
	const selectionSettings = useMemo(() => {
		if (!gumballProps) return {};

		return {
			nameFilter: gumballProps.nameFilter,
			hover: gumballProps.hover,
			minimumSelection: 0,
			maximumSelection: Infinity
		} as ISelectionParameterProps;
	}, [gumballProps]);

	// use the selection hook to get the selected node names
	const { selectedNodeNames, setSelectedNodeNames, availableNodeNames, setSelectedNodeNamesAndRestoreSelection, handlers } = useSelection(sessionIds, viewportId, selectionSettings, activate);
	// use the gumball events hook to get the transformed node names
	const { transformedNodeNames, setTransformedNodeNames } = useGumballEvents(selectedNodeNames, initialTransformedNodeNames, strictNaming);

	// use an effect to set the selected node names to the first available node name if only one is available
	useEffect(() => {
		const singleAvailableNodeName = getSingleAvailableNodeName(availableNodeNames);
		if(activate && singleAvailableNodeName) {
			setSelectedNodeNamesAndRestoreSelection([singleAvailableNodeName]);
		}
	}, [availableNodeNames, setSelectedNodeNamesAndRestoreSelection]);

	// create a reference for the gumball
	const gumballRef = useRef<Gumball | undefined>(undefined);

	// use an effect to create the gumball whenever the selected node names change
	useEffect(() => {
		if (viewportApi) {
			// whenever the selected node names change, create a new gumball
			const nodes = getNodesByName(sessionApis, selectedNodeNames);
			const gumball = new Gumball(viewportApi, Object.values(nodes).map(n => n.node), gumballProps);
			gumballRef.current = gumball;
		}

		return () => {
			// clean up the select manager
			if (gumballRef.current) {
				gumballRef.current.close();
				gumballRef.current = undefined;
			}
		};
	}, [viewportApi, sessionApis, selectedNodeNames]);
	
	/**
	 * Restore the transformed node names.
	 * 
	 * This function is used to restore the transformed nodes to their new transformation state.
	 * This means that the transformation of the nodes is updated to the new transformation state.
	 * 
	 * @param newTransformedNodeNames The new transformed node names.
	 * @param oldTransformedNodeNames The old transformed node names.
	 * @returns
	 */
	const restoreTransformedNodeNames = useCallback((newTransformedNodeNames: { name: string, transformation: number[], localTransformations?: number[] }[], oldTransformedNodeNames: { name: string }[]) => {
		const nodes = getNodesByName(sessionApis, oldTransformedNodeNames.map(tn => tn.name));

		nodes.forEach(tn => {
			// get the new transformation matrix (if it exists)
			const newTransformation = newTransformedNodeNames.find(nt => nt.name === tn.name);

			// if there is a local transformation present that we can reset to, use it
			let transformationMatrix: mat4 | undefined;
			if(newTransformation && newTransformation.localTransformations) 
				transformationMatrix = mat4.fromValues(...(newTransformation.localTransformations as [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number]));

			// update the gumball transformation
			// in case the transformation matrix is undefined, the transformation will be reset
			updateGumballTransformation(tn.node, transformationMatrix);
		});

		setTransformedNodeNames(newTransformedNodeNames);

	}, [sessionApis]);

	return {
		transformedNodeNames,
		setTransformedNodeNames,
		selectedNodeNames,
		setSelectedNodeNames,
		restoreTransformedNodeNames,
		handlers
	};
}

/**
 * Get a single available node name, if there is only one available.
 * 
 * @param availableNodeNames 
 * @returns 
 */
const getSingleAvailableNodeName = (availableNodeNames: { [key: string]: { [key: string]: string[] } }): string | undefined => {
	let availableNodeName: string | undefined = undefined;
	let count = 0;

	for (const outerObj of Object.values(availableNodeNames)) {
		for (const arr of Object.values(outerObj)) {
			count += arr.length;
			if (count > 1) return;
			if (arr.length === 1) availableNodeName = arr[0];
		}
	}

	return availableNodeName;
};

// #endregion Functions (1)
