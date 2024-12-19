import { IOutputApi, ISelectionParameterProps, ITreeNode, OutputApiData, SessionApiData } from "@shapediver/viewer.session";
import { checkNodeNameMatch, InteractionData, MultiSelectManager, SelectManager } from "@shapediver/viewer.features.interaction";
import React, { useCallback, useEffect, useId, useMemo, useState } from "react";
import { vec3 } from "gl-matrix";
import { ISelectionState, useSelectManagerEvents } from "./useSelectManagerEvents";
import { useSelectManager } from "./useSelectManager";
import { useHoverManager } from "./useHoverManager";
import { useCreateNameFilterPattern } from "../useCreateNameFilterPattern";
import { useShapeDiverStoreSession } from "../../../../../store/useShapeDiverStoreSession";
import { INodeInteractionDataState, NodeInteractionDataHandler } from "../useNodeInteractionData";

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
	initialSelectedNodeNames?: string[],
	strictNaming: boolean = true
): ISelectionState & {
	/**
	 * The available node names in a dictionary for each output.
	 */
	availableNodeNames: { [key: string]: { [key: string]: string[] }},
	/**
	 * Set the selected node names and restore the selection status.
	 * 
	 * @param names The names of the nodes to be selected.
	 * @returns 
	 */
	setSelectedNodeNamesAndRestoreSelection: (names: string[]) => void,
	/**
	 * The handlers for the node interaction data.
	 */
	handlers: JSX.Element[]
} {

	// create a unique component ID
	const componentId = useId();

	// call the select manager hook
	const { selectManager } = useSelectManager(viewportId, componentId, activate ? selectionProps : undefined);

	// store the select manager in a ref
	const selectManagerRef = React.useRef<SelectManager | MultiSelectManager>();
	useEffect(() => {
		selectManagerRef.current = selectManager;
	}, [selectManager]);

	// call the hover manager hook
	const hoverSettings = useMemo(() => { return { hoverColor: selectionProps.hoverColor }; }, [selectionProps]);
	useHoverManager(viewportId, componentId, activate ? hoverSettings : undefined);
	
	// convert the user-defined name filters to filter patterns, and subscribe to selection events
	const { patterns } = useCreateNameFilterPattern(sessionIds, selectionProps.nameFilter);
	const { selectedNodeNames, setSelectedNodeNames, resetSelectedNodeNames } = useSelectManagerEvents(patterns, componentId, initialSelectedNodeNames, strictNaming);

	// state for available node names
	const [availableNodeNames, setAvailableNodeNames] = useState<{ [key: string]: { [key: string]: string[]}}>({});

	// add interaction data for each output, even if it is not in the pattern
	// this is necessary to keep the number of hooks constant
	// TODO to work around this, we would need a hook similar to useOutputUpdateCallback, 
	// but for all outputs (or the session), e.g. useSessionOutputsUpdateCallback
	const interactionSettings = useMemo(
		() => { return { select: true, hover: selectionProps.hover }; },
		[selectionProps]
	);

	const [nodeInteractionDataHandlers, setNodeInteractionDataHandlers] = useState<JSX.Element[]>([]);
	const [interactionDataStateMap, setInteractionDataStateMap] = useState<{ [key: string]: { [key: string]: INodeInteractionDataState }}>({});

	useEffect(() => {
		const nodeInteractionDataHandlers: JSX.Element[] = [];

		Object.entries(patterns).forEach(([sessionId, pattern]) => {
			Object.entries(pattern).forEach(([outputId, pattern]) => {
				if (!interactionDataStateMap[sessionId]?.[outputId]) {
					setInteractionDataStateMap(prev => ({
						...prev,
						[sessionId]: {
							...prev[sessionId],
							[outputId]: {
								outputApi: undefined,
								outputNode: undefined,
								availableNodeNames: []
							}
						}
					}));
				}

				nodeInteractionDataHandlers.push(
					<NodeInteractionDataHandler
						key={`nodeInteractionDataHandler_${componentId}_${outputId}_${JSON.stringify(pattern)}`}
						sessionId={sessionId}
						componentId={componentId}
						outputIdOrName={outputId}
						patterns={pattern}
						interactionSettings={interactionSettings}
						selectManager={selectManager}
						strictNaming={strictNaming}
						setData={(data) => {
							setInteractionDataStateMap(prev => ({
								...prev,
								[sessionId]: {
									...prev[sessionId],
									[outputId]: data as INodeInteractionDataState
								}
							}));
						}}
					/>
				);
			});
		});

		setNodeInteractionDataHandlers(nodeInteractionDataHandlers);
	}, [patterns, selectManager]);

	const outputsPerSession = useShapeDiverStoreSession(state => {
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


	// in case selection becomes active or the output node changes, restore the selection status
	useEffect(() => {
		if(!selectManager) return;
		Object.values(interactionDataStateMap).forEach(outputData => {
			Object.values(outputData).forEach(data => {
				if(data.outputNode) {
					restoreSelection(outputsPerSession, componentId, selectManager, selectedNodeNames, strictNaming);
				}
			});
		});
	}, [interactionDataStateMap, selectManager, componentId]);

	// update the available node names
	useEffect(() => {
		const availableNodeNames: { [key: string]: { [key: string]: string[] }} = {};
		Object.entries(interactionDataStateMap).forEach(([sessionId, outputData]) => {
			Object.entries(outputData).forEach(([outputId, data]) => {
				if(!availableNodeNames[sessionId]) availableNodeNames[sessionId] = {};
				availableNodeNames[sessionId][outputId] = data.availableNodeNames;
			});
		});
		setAvailableNodeNames(availableNodeNames);
	}, [interactionDataStateMap]);

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
		restoreSelection(outputsPerSession, componentId, selectManagerRef.current, names, strictNaming);
	}, [componentId]);

	return {
		selectedNodeNames,
		setSelectedNodeNames, 
		resetSelectedNodeNames,
		availableNodeNames,
		setSelectedNodeNamesAndRestoreSelection,
		handlers: nodeInteractionDataHandlers
	};
}

/**
 * Restore the selection status for the given outputs.
 * 
 * @param outputsPerSession 
 * @param selectManager 
 * @param selectedNodeNames 
 */
const restoreSelection = (outputsPerSession: { [key: string]: { [key: string]: IOutputApi }}, componentId: string, selectManager?: SelectManager | MultiSelectManager, selectedNodeNames: string[] = [], strictNaming: boolean = true) => {
	for (const sessionId in outputsPerSession) {
		const outputs = outputsPerSession[sessionId];
		for (const outputId in outputs) {
			const outputNode = outputs[outputId].node;
			if (outputNode && selectManager)
				restoreNodeSelection(outputNode, componentId, selectManager, selectedNodeNames, strictNaming);
		}
	}
};

/**
 * Restore selection status for the given node.
 * 
 * @param node 
 * @param mgr 
 * @param selectedNodeNames 
 * @returns 
 */
const restoreNodeSelection = (node: ITreeNode, componentId: string, mgr: SelectManager | MultiSelectManager, selectedNodeNames: string[], strictNaming: boolean) => {
	// the node must have an OutputApiData object
	let outputApi = node.data.find((data) => data instanceof OutputApiData)?.api;
	if (!outputApi) {
		// try to find it in the session api
		const sessionApi = node.parent?.data.find((data) => data instanceof SessionApiData)?.api;
		if(!sessionApi) return;

		outputApi = sessionApi.outputs[node.name];
		if(!outputApi) return;
	}

	// deselect all nodes restricted to the component id
	node.traverse(n => {
		const interactionData = n.data.filter(d => d instanceof InteractionData) as InteractionData[];
		interactionData.forEach(d => {
			if(d instanceof InteractionData && d.restrictedManagers.includes(componentId))
				mgr.deselect(n);
		});
	});

	// select child nodes based on selectedNodeNames
	selectedNodeNames.forEach((name) => {
		const parts = name.split(".");
		if (outputApi.name !== parts[0]) return;

		if (parts.length === 1) {
			// special case if only the output name is given
			const interactionData = node.data.filter(d => d instanceof InteractionData) as InteractionData[];
			if (interactionData.some(d => d instanceof InteractionData && d.restrictedManagers.includes(componentId)))
				mgr.select({ distance: 1, point: vec3.create(), node: node });
		} else {
			// if the node name matches the pattern, select the node
			node.traverse(n => {
				if (checkNodeNameMatch(n, parts.slice(1).join("."), strictNaming)) {
					const interactionData = n.data.filter(d => d instanceof InteractionData) as InteractionData[];
					if (interactionData.some(d => d instanceof InteractionData && d.restrictedManagers.includes(componentId)))
						mgr.select({ distance: 1, point: vec3.create(), node: n });
				}
			});
		}
	});
};

// #endregion Functions (1)
