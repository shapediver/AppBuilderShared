import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session";
import {useShapeDiverStoreInstances} from "@AppBuilderShared/features";
import {
	checkNodeNameMatch,
	getNodeName,
	InteractionData,
	MultiSelectManager,
	SelectManager,
} from "@shapediver/viewer.features.interaction";
import {
	IOutputApi,
	ISelectionParameterProps,
	ITreeNode,
	OutputApiData,
	SessionApiData,
} from "@shapediver/viewer.session";
import {vec3} from "gl-matrix";
import React, {useCallback, useEffect, useId, useMemo} from "react";
import {useCreateNameFilterPattern} from "./useCreateNameFilterPattern";
import {useHoverManager} from "./useHoverManager";
import {
	IUseNodeInteractionDataProps,
	useNodesInteractionData,
} from "./useNodeInteractionData";
import {useSelectManager} from "./useSelectManager";
import {
	ISelectionState,
	useSelectManagerEvents,
} from "./useSelectManagerEvents";

// #region Functions (1)

/**
 * Hook providing stateful object selection for a viewport and session.
 * This wraps lover level hooks for the select manager, hover manager, and node interaction data.
 *
 * @param viewportId ID of the viewport for which selection shall be enabled.
 * @param selectionProps Parameter properties to be used. This includes name filters, and properties for the behavior of the selection.
 * @param activate Set this to true to activate selection. If false, preparations are made but no selection is possible.
 * @param initialSelectedNodeNames The initial selected node names (used to initialize the selection state).
 * 					Note that this initial state is not checked against the filter pattern.
 */
export function useSelection(
	viewportId: string,
	selectionProps: ISelectionParameterProps,
	activate: boolean,
	initialSelectedNodeNames?: string[],
	strictNaming: boolean = true,
): ISelectionState & {
	/**
	 * The available node names in a dictionary for each output.
	 */
	availableNodeNames: {[key: string]: {[key: string]: string[]}};
	/**
	 * Set the selected node names and restore the selection status.
	 *
	 * @param names The names of the nodes to be selected.
	 * @returns
	 */
	setSelectedNodeNamesAndRestoreSelection: (names: string[]) => void;
} {
	// create a unique component ID
	const componentId = useId();

	// call the select manager hook
	const {selectManager, setAvailableNodes, removeAvailableEffectsForNodes} =
		useSelectManager(
			viewportId,
			componentId,
			activate ? selectionProps : undefined,
		);

	// store the select manager in a ref
	const selectManagerRef = React.useRef<SelectManager | MultiSelectManager>();
	useEffect(() => {
		selectManagerRef.current = selectManager;
	}, [selectManager]);

	// store the removeAvailableEffectsForNodes callback in a ref
	const removeAvailableEffectsRef = React.useRef<
		((nodes: ITreeNode[]) => void) | undefined
	>(removeAvailableEffectsForNodes);
	useEffect(() => {
		removeAvailableEffectsRef.current = removeAvailableEffectsForNodes;
	}, [removeAvailableEffectsForNodes]);

	// call the hover manager hook
	const hoverSettings = useMemo(() => {
		return {hoverColor: selectionProps.hoverColor};
	}, [selectionProps]);
	useHoverManager(
		viewportId,
		componentId,
		activate ? hoverSettings : undefined,
	);

	// create the input for the name filter pattern
	const createNameFilterInput = useMemo(() => {
		return {
			nameFilter: selectionProps.nameFilter,
		};
	}, [selectionProps]);

	// convert the user-defined name filters to filter patterns, and subscribe to selection events
	const {patterns} = useCreateNameFilterPattern(createNameFilterInput);

	const {selectedNodeNames, setSelectedNodeNames, resetSelectedNodeNames} =
		useSelectManagerEvents(
			patterns,
			componentId,
			initialSelectedNodeNames,
			strictNaming,
		);

	const nodesInteractionInput = useMemo(() => {
		const nodesInteractionInput: {
			[key: string]: IUseNodeInteractionDataProps;
		} = {};

		if (patterns.outputPatterns) {
			Object.entries(patterns.outputPatterns).forEach(
				([sessionId, pattern]) => {
					Object.entries(pattern).forEach(([outputId, pattern]) => {
						nodesInteractionInput[
							JSON.stringify([sessionId, outputId])
						] = {
							sessionId,
							componentId,
							outputId,
							patterns: pattern,
							interactionSettings: {
								select: true,
								hover: selectionProps.hover,
							},
							selectManagerRef,
							removeAvailableEffectsRef,
							strictNaming,
						};
					});
				},
			);
		}

		if (patterns.instancePatterns) {
			Object.entries(patterns.instancePatterns).forEach(
				([instanceId, pattern]) => {
					nodesInteractionInput[instanceId] = {
						componentId,
						patterns: pattern,
						interactionSettings: {
							select: true,
							hover: selectionProps.hover,
						},
						selectManagerRef,
						strictNaming,
					};
				},
			);
		}

		return nodesInteractionInput;
	}, [patterns, selectionProps]);

	const {availableNodeNames} = useNodesInteractionData(
		activate ? nodesInteractionInput : {},
	);

	const outputsPerSession = useShapeDiverStoreSession((state) => {
		const outputs: {
			[key: string]: {
				[key: string]: IOutputApi;
			};
		} = {};
		for (const sessionId in state.sessions)
			if (state.sessions[sessionId])
				outputs[sessionId] = state.sessions[sessionId].outputs;

		return outputs;
	});

	const instances = useShapeDiverStoreInstances((state) => state.instances);

	// when the available node names change, we need to update the selected node names
	// to ensure that the selected nodes are still available
	useEffect(() => {
		// intentionally stale to only re-render when availableNodeNames changes
		if (!activate) return;

		const newSelectedNodeNames: string[] = [];
		if (selectedNodeNames.length > 0 && availableNodeNames) {
			selectedNodeNames.forEach((name) => {
				Object.values(availableNodeNames).forEach((availableNames) => {
					if (availableNames.map((n) => n.name).includes(name)) {
						newSelectedNodeNames.push(name);
					}
				});
			});
		}

		// if the selected node names are the same, we don't need to update the state
		if (
			newSelectedNodeNames.length === selectedNodeNames.length &&
			newSelectedNodeNames.every((name) =>
				selectedNodeNames.includes(name),
			)
		)
			return;
		setSelectedNodeNames(newSelectedNodeNames);
	}, [availableNodeNames]);

	/**
	 * Effect to update the available nodes in the select manager.
	 * The available nodes are all nodes that match the filter pattern and are not currently selected.
	 */
	useEffect(() => {
		const nodes = Object.values(availableNodeNames).flatMap(
			(availableNames) => {
				return availableNames.filter(
					(available) => !selectedNodeNames.includes(available.name),
				);
			},
		);
		setAvailableNodes(nodes.map((n) => n.node));
	}, [availableNodeNames, selectedNodeNames]);

	// in case selection becomes active or the output node changes, restore the selection status
	useEffect(() => {
		if (!selectManager) return;

		restoreSelection(
			outputsPerSession,
			instances,
			componentId,
			selectManager,
			selectedNodeNames,
			strictNaming,
		);
	}, [outputsPerSession, instances, componentId, selectManager]);

	// we need to return the available node names in a dictionary for each output
	// therefore we need to transform the availableNodeNames object into a dictionary
	// with session and output IDs as keys
	const availableNodeNamesReturn = useMemo(() => {
		const availableNodeNamesPerOutput: {
			[key: string]: {[key: string]: string[]};
		} = {};

		Object.entries(availableNodeNames).forEach(([key, value]) => {
			if (key.startsWith("[")) {
				// Output pattern key: JSON.stringify([sessionId, outputId])
				const [sessionId, outputId] = JSON.parse(key) as string[];
				if (!availableNodeNamesPerOutput[sessionId])
					availableNodeNamesPerOutput[sessionId] = {};
				availableNodeNamesPerOutput[sessionId][outputId] = value.map(
					(v) => v.name,
				);
			} else {
				// Instance pattern key: plain instanceId string
				if (!availableNodeNamesPerOutput[key])
					availableNodeNamesPerOutput[key] = {};
				availableNodeNamesPerOutput[key][""] = value.map((v) => v.name);
			}
		});

		return availableNodeNamesPerOutput;
	}, [availableNodeNames]);

	/**
	 * Set the selected node names and restore the selection status.
	 * This function is used to set the selected node names and select the corresponding nodes.
	 *
	 * Currently it is used in the special case where only one node is selectable in the useGumball hook.
	 *
	 * @param names The names of the nodes to be selected.
	 */
	const setSelectedNodeNamesAndRestoreSelection = useCallback(
		(names: string[]) => {
			setSelectedNodeNames(names);
			restoreSelection(
				outputsPerSession,
				instances,
				componentId,
				selectManagerRef.current,
				names,
				strictNaming,
			);
		},
		[
			outputsPerSession,
			instances,
			componentId,
			setSelectedNodeNames,
			restoreSelection,
		],
	);

	return {
		selectedNodeNames,
		setSelectedNodeNames,
		resetSelectedNodeNames,
		availableNodeNames: availableNodeNamesReturn,
		setSelectedNodeNamesAndRestoreSelection,
	};
}

/**
 * Restore the selection status for the given outputs.
 *
 * @param outputsPerSession
 * @param selectManager
 * @param selectedNodeNames
 */
const restoreSelection = (
	outputsPerSession: {[key: string]: {[key: string]: IOutputApi}},
	instances: {[key: string]: ITreeNode},
	componentId: string,
	selectManager?: SelectManager | MultiSelectManager,
	selectedNodeNames: string[] = [],
	strictNaming: boolean = true,
) => {
	for (const sessionId in outputsPerSession) {
		const outputs = outputsPerSession[sessionId];
		for (const outputId in outputs) {
			const outputNode = outputs[outputId].node;
			if (outputNode && selectManager)
				restoreNodeSelection(
					outputNode,
					componentId,
					selectManager,
					selectedNodeNames,
					strictNaming,
				);
		}
	}

	// also check instances for selection restoration
	for (const instanceId in instances) {
		const instanceNode = instances[instanceId];
		if (instanceNode && selectManager)
			restoreNodeSelection(
				instanceNode,
				componentId,
				selectManager,
				selectedNodeNames,
				strictNaming,
			);
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
const restoreNodeSelection = (
	node: ITreeNode,
	componentId: string,
	mgr: SelectManager | MultiSelectManager,
	selectedNodeNames: string[],
	strictNaming: boolean,
) => {
	// The identifier used to match the first part of selected node names.
	// For regular output nodes this is the output name; for instance nodes it is the instance ID.
	let nameIdentifier: string;
	// Whether this is an instance node (vs. a session output node).
	// This affects how checkNodeNameMatch is called (see PatternUtils.getNodesByName).
	let isInstance = false;

	// the node must have an OutputApiData object
	let outputApi = node.data.find(
		(data) => data instanceof OutputApiData,
	)?.api;
	if (!outputApi) {
		// try to find it in the session api
		const sessionApi = node.parent?.data.find(
			(data) => data instanceof SessionApiData,
		)?.api;
		if (!sessionApi) return;

		outputApi = sessionApi.outputs[node.name];
		if (outputApi) {
			nameIdentifier = outputApi.name;
		} else {
			// Instance node: SessionApiData is in the parent but the node is not a session
			// output. Use getNodeName (matching the logic in PatternUtils.getInstanceNodeData)
			// as the identifier so it aligns with how selected node names are built.
			nameIdentifier = getNodeName(node, strictNaming) ?? node.name;
			isInstance = true;
		}
	} else {
		nameIdentifier = outputApi.name;
	}

	// deselect all nodes restricted to the component id
	node.traverse((n) => {
		const interactionData = n.data.filter(
			(d) => d instanceof InteractionData,
		) as InteractionData[];
		interactionData.forEach((d) => {
			if (
				d instanceof InteractionData &&
				d.restrictedManagers.includes(componentId)
			)
				mgr.deselect(n);
		});
	});

	// select child nodes based on selectedNodeNames
	selectedNodeNames.forEach((name) => {
		const parts = name.split(".");
		if (nameIdentifier !== parts[0]) return;

		if (parts.length === 1) {
			// special case if only the output/instance name is given
			const interactionData = node.data.filter(
				(d) => d instanceof InteractionData,
			) as InteractionData[];
			if (
				interactionData.some(
					(d) =>
						d instanceof InteractionData &&
						d.restrictedManagers.includes(componentId),
				)
			)
				mgr.select({distance: 1, point: vec3.create(), node: node});
		} else {
			// For output nodes: pass parts without the output name prefix (parts.slice(1)).
			// For instance nodes: pass the full name (parts.join(".") === name) because
			// the instance name is part of the node's path (it has an originalName set),
			// matching the behaviour of PatternUtils.getNodesByName.
			const matchName = isInstance ? name : parts.slice(1).join(".");

			// if the node name matches the pattern, select the node
			node.traverse((n) => {
				if (checkNodeNameMatch(n, matchName, strictNaming)) {
					const interactionData = n.data.filter(
						(d) => d instanceof InteractionData,
					) as InteractionData[];
					if (
						interactionData.some(
							(d) =>
								d instanceof InteractionData &&
								d.restrictedManagers.includes(componentId),
						)
					)
						mgr.select({
							distance: 1,
							point: vec3.create(),
							node: n,
						});
				}
			});
		}
	});
};

// #endregion Functions (1)
