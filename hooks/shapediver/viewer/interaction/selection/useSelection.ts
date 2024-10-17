import { IOutputApi, ISelectionParameterProps, ITreeNode, OutputApiData } from "@shapediver/viewer";
import { InteractionData, MultiSelectManager, SelectManager } from "@shapediver/viewer.features.interaction";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { vec3 } from "gl-matrix";
import { ISelectionState, useSelectManagerEvents } from "./useSelectManagerEvents";
import { useSelectManager } from "./useSelectManager";
import { useHoverManager } from "./useHoverManager";
import { useCreateNameFilterPattern } from "../useCreateNameFilterPattern";
import { useShapeDiverStoreViewer } from "../../../../../store/useShapeDiverStoreViewer";
import { useNodeInteractionData } from "../useNodeInteractionData";

// #region Functions (1)

/**
 * Hook providing stateful object selection for a viewport and session. 
 * This wraps lover level hooks for the select manager, hover manager, and node interaction data.
 * 
 * @param sessionIds IDs of the sessions for which objects shall be selected.
 * @param viewportId ID of the viewport for which selection shall be enabled. 
 * @param selectionProps Parameter properties to be used. This includes name filters, and properties for the behavior of the selection.
 * @param activate Set this to true to activate selection. If false, preparations are made but no selection is possible.
 * @param initialSelectedNodeNames The initial selected node names (used to initialize the selection state).
 * 					Note that this initial state is not checked against the filter pattern. 
 */
export function useSelection(
	sessionIds: string[], 
	viewportId: string, 
	selectionProps: ISelectionParameterProps,
	activate: boolean,
	initialSelectedNodeNames?: string[]
): ISelectionState & {
	/**
	 * The available node names in a dictionary for each output.
	 */
	availableNodeNames: { [key: string]: string[] },
	/**
	 * Set the selected node names and restore the selection status.
	 * 
	 * @param names The names of the nodes to be selected.
	 * @returns 
	 */
	setSelectedNodeNamesAndRestoreSelection: (names: string[]) => void
} {

	// create a unique component ID
	const componentId = useId();

	// call the select manager hook
	const { selectManager } = useSelectManager(viewportId, componentId, activate ? selectionProps : undefined);

	// call the hover manager hook
	const hoverSettings = useMemo(() => { return { hoverColor: selectionProps.hoverColor }; }, [selectionProps]);
	useHoverManager(viewportId, componentId, activate ? hoverSettings : undefined);
	
	// convert the user-defined name filters to filter patterns, and subscribe to selection events
	const { patterns } = useCreateNameFilterPattern(sessionIds, selectionProps.nameFilter);
	const { selectedNodeNames, setSelectedNodeNames, resetSelectedNodeNames } = useSelectManagerEvents(patterns, componentId, initialSelectedNodeNames);

	// state for available node names
	const [availableNodeNames, setAvailableNodeNames] = useState<{ [key: string]: string[]}>({});

	// add interaction data for each output, even if it is not in the pattern
	// this is necessary to keep the number of hooks constant
	// TODO to work around this, we would need a hook similar to useOutputUpdateCallback, 
	// but for all outputs (or the session), e.g. useSessionOutputsUpdateCallback
	const interactionSettings = useMemo(
		() => { return { select: true, hover: selectionProps.hover }; },
		[selectionProps]
	);
	const outputsPerSession = useShapeDiverStoreViewer(state => {
		const outputs: {
			[key: string]: {
				[key: string]: IOutputApi;
			}
		} = {};
		for(const sessionId of sessionIds)
			if(state.sessions[sessionId])
				outputs[sessionId] = state.sessions[sessionId].outputs;

		return outputs; 
	});
	for (const sessionId in outputsPerSession) {
		const outputs = outputsPerSession[sessionId];
		for (const outputId in outputs) {
			// add interaction data
			if (!patterns[outputId]) patterns[outputId] = [];
			const { outputNode, availableNodeNames: availableNodeNamesForOutput } = useNodeInteractionData(sessionId, componentId, outputId, patterns[outputId], interactionSettings);
			// in case selection becomes active or the output node changes, restore the selection status
			useEffect(() => {
				if (outputNode && selectManager)
					restoreSelection(outputNode, selectManager, selectedNodeNames);
			}, [outputNode, selectManager]);

			// update the available node names
			useEffect(() => {
				setAvailableNodeNames(prev => {
					return { ...prev, [outputs[outputId].name]: availableNodeNamesForOutput };
				});
			}, [availableNodeNamesForOutput]);
		}
	}

	/**
	 * Set the selected node names and restore the selection status.
	 * This function is used to set the selected node names and select the corresponding nodes.
	 * 
	 * Currently it is used in the special case where only one node is selectable in the useGumball hook.
	 * 
	 * @param names The names of the nodes to be selected.
	 */
	const setSelectedNodeNamesAndRestoreSelection = useCallback((names: string[]) => {
		setSelectedNodeNames(names);
		for (const sessionId in outputsPerSession) {
			const outputs = outputsPerSession[sessionId];
			for (const outputId in outputs) {
				const outputNode = outputs[outputId].node;
				if (outputNode && selectManager)
					restoreSelection(outputNode, selectManager, names);
			}
		}
	}, [selectManager]);

	return {
		selectedNodeNames,
		setSelectedNodeNames, 
		resetSelectedNodeNames,
		availableNodeNames,
		setSelectedNodeNamesAndRestoreSelection
	};
}

/**
 * Restore selection status
 * @param node 
 * @param mgr 
 * @param selectedNodeNames 
 * @returns 
 */
const restoreSelection = (node: ITreeNode, mgr: SelectManager | MultiSelectManager, selectedNodeNames: string[]) => {
	
	// the node must have an OutputApiData object
	const apiData = node.data.find(d => d instanceof OutputApiData) as OutputApiData;
	if (!apiData) return;

	// select child nodes based on selectedNodeNames
	selectedNodeNames.forEach((name) => {
	
		const parts = name.split(".");
		if (apiData.api.name !== parts[0]) return;

		if (parts.length === 1) {
			// special case if only the output name is given
			const interactionData = node.data.find(d => d instanceof InteractionData) as InteractionData;
			if (interactionData) 
				mgr.select({ distance: 1, point: vec3.create(), node: node });
		} else {
			// if the node name matches the pattern, select the node
			node.traverse(n => {
				if (n.getPath().endsWith(parts.slice(1).join("."))) {
					const interactionData = n.data.find(d => d instanceof InteractionData) as InteractionData;
					if (interactionData)
						mgr.select({ distance: 1, point: vec3.create(), node: n });
				}
			});
		}
	});
};

// #endregion Functions (1)
