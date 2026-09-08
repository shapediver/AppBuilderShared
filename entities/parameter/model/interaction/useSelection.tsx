import {
	InteractionData,
	MultiSelectManager,
	SelectManager,
} from "@shapediver/viewer.features.interaction";
import {ITreeNode} from "@shapediver/viewer.session";
import type {ISelectionParameterProps} from "@shapediver/viewer.shared.types";
import {vec3} from "gl-matrix";
import React, {useCallback, useEffect, useId, useMemo} from "react";
import {useCreateNameFilterPattern} from "./useCreateNameFilterPattern";
import {useHoverManager} from "./useHoverManager";
import {
	IUseNodeInteractionDataProps,
	IUseNodeInteractionDataResult,
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
	suppressSingleSelectionEffect: boolean = false,
): ISelectionState & {
	/**
	 * All resolved candidate nodes (unfiltered — selected nodes NOT excluded).
	 * Used for ownership conflict detection at the registration layer.
	 */
	candidateNodes: Array<{nodeId: string; name: string}>;
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
	/**
	 * Request restoration of the current selection after an interaction resumes.
	 * This is needed when node interaction data changed while the manager was
	 * suspended, because none of the regular selection-state dependencies then
	 * change at resume time.
	 */
	requestSelectionRestore: () => void;
} {
	// create a unique component ID
	const componentId = useId();
	const [singleCandidateSuppressed, setSingleCandidateSuppressed] =
		React.useState(false);

	// call the select manager hook
	const {
		selectManager,
		setAvailableNodes,
		removeAvailableEffectsForNodes,
		availableNodes: managerAvailableNodes,
	} = useSelectManager(
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
		return {
			hoverColor: selectionProps.hoverColor,
			occludeBySceneGeometry: selectionProps.occludeBySceneGeometry,
		};
	}, [selectionProps]);
	useHoverManager(
		viewportId,
		componentId,
		activate && !singleCandidateSuppressed ? hoverSettings : undefined,
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
			activate,
			selectManager,
		);
	const [restoreRevision, requestSelectionRestore] = React.useReducer(
		(revision: number) => revision + 1,
		0,
	);

	// A selection can be cleared before the first manager instance reaches this
	// hook. Keep the viewer manager synchronized once it becomes available.
	useEffect(() => {
		if (!selectManager || selectedNodeNames.length > 0) return;
		if (selectManager instanceof SelectManager) selectManager.deselect();
		else if (selectManager instanceof MultiSelectManager)
			selectManager.deselectAll();
	}, [selectManager, selectedNodeNames]);

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
								select: !singleCandidateSuppressed,
								hover:
									!singleCandidateSuppressed &&
									selectionProps.hover,
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
							select: !singleCandidateSuppressed,
							hover:
								!singleCandidateSuppressed &&
								selectionProps.hover,
						},
						selectManagerRef,
						removeAvailableEffectsRef,
						strictNaming,
					};
				},
			);
		}

		return nodesInteractionInput;
	}, [patterns, selectionProps, singleCandidateSuppressed]);

	const {availableNodeNames} = useNodesInteractionData(nodesInteractionInput);

	useEffect(() => {
		if (!suppressSingleSelectionEffect) return;
		const candidateCount = Object.values(availableNodeNames).flat().length;
		setSingleCandidateSuppressed(activate && candidateCount === 1);
	}, [activate, availableNodeNames, suppressSingleSelectionEffect]);

	// when the available node names change, we need to update the selected node names
	// to ensure that the selected nodes are still available
	useEffect(() => {
		// intentionally stale to only re-render when availableNodeNames changes
		if (!activate) return;

		const newSelectedNodeNames: string[] = [];
		if (selectedNodeNames.length > 0 && availableNodeNames) {
			// If there are no available nodes at all (e.g. after a computation clear),
			// don't clear the selection — nodes will be repopulated shortly.
			const allAvailableNames = Object.values(availableNodeNames).flat();
			if (allAvailableNames.length === 0) {
				return;
			}

			const candidateNames = new Set(
				allAvailableNames.map((n) => n.name),
			);
			// The outputs (or instances) which have candidates: their update is
			// complete, a selected node of such an output which is not a
			// candidate anymore was removed by the update (e.g. a deleted object).
			const updatedOutputs = new Set(
				allAvailableNames.map((n) => n.name.split(".")[0]),
			);

			selectedNodeNames.forEach((name) => {
				if (candidateNames.has(name)) {
					newSelectedNodeNames.push(name);
					return;
				}
				// Do not silently replace a missing node with another object from the
				// same output. A node of an output without candidates is kept: the
				// output may still be rebuilding. A node of an updated output was
				// removed: it is pruned from the selection (like a deselection, the
				// pruned selection is committed automatically where applicable).
				if (!updatedOutputs.has(name.split(".")[0])) {
					newSelectedNodeNames.push(name);
				}
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
		if (!activate) {
			setAvailableNodes([]);
			return;
		}
		const nodes = Object.values(availableNodeNames).flatMap(
			(availableNames) => {
				return availableNames.filter(
					(available) => !selectedNodeNames.includes(available.name),
				);
			},
		);
		setAvailableNodes(nodes.map((n) => n.node));
		// Intentionally only rerun for selection state changes. The manager
		// callbacks and its available-node array are recreated by the manager
		// hook, so subscribing to them would cause an update loop.
	}, [availableNodeNames, selectedNodeNames, activate]);

	// in case selection becomes active or the output node changes, restore the selection status.
	// availableNodeNames is included so this effect also fires after a computation update:
	// createOutputUpdateCallback updates availableNodeNames after adding InteractionData to
	// the new nodes, so we re-apply the selection effect at that point. The selection is
	// restored on the output nodes of these candidates: the output node of the session API
	// (output.node) lags behind the output update callback, restoring on it would miss the
	// new nodes.
	// selectedNodeNames is included so this effect also fires when Effect 1 above maps a stale
	// selected name to a fallback available name (e.g. after a geometry change where the exact
	// child path no longer exists in the new output tree).
	// Skip when selectedNodeNames is empty: there is nothing to restore, and calling
	// restoreNodeSelection with an empty list would unconditionally deselect all nodes
	// (undoing a selection that was just re-applied by a prior effect run).
	useEffect(() => {
		if (!activate || singleCandidateSuppressed) return;
		if (!selectManager) return;
		if (selectedNodeNames.length === 0) return;

		restoreSelection(
			availableNodeNames,
			componentId,
			selectManager,
			selectedNodeNames,
		);
	}, [
		componentId,
		selectManager,
		availableNodeNames,
		selectedNodeNames,
		restoreRevision,
		managerAvailableNodes,
		singleCandidateSuppressed,
	]);

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
			const manager = selectManagerRef.current ?? selectManager;
			if (names.length === 0) {
				if (manager instanceof SelectManager) manager.deselect();
				else if (manager instanceof MultiSelectManager)
					manager.deselectAll();
				return;
			}
			restoreSelection(availableNodeNames, componentId, manager, names);
		},
		[
			availableNodeNames,
			componentId,
			setSelectedNodeNames,
			selectManager,
			restoreSelection,
		],
	);

	const candidateNodes = useMemo(
		() =>
			Object.values(availableNodeNames)
				.flat()
				.map((entry) => ({nodeId: entry.node.id, name: entry.name})),
		[availableNodeNames],
	);

	return {
		candidateNodes,
		selectedNodeNames,
		setSelectedNodeNames,
		resetSelectedNodeNames,
		availableNodeNames: availableNodeNamesReturn,
		setSelectedNodeNamesAndRestoreSelection,
		requestSelectionRestore,
	};
}

/**
 * Restore the selection status: the candidate nodes (the nodes the interaction
 * data was added to, see useNodesInteractionData) whose names are selected are
 * selected, all others are deselected.
 *
 * The candidates are used instead of traversing the output nodes of the session
 * API: output.node lags behind the output update callback which adds the
 * interaction data, traversing it would miss the new nodes after an update.
 *
 * @param availableNodeNames The candidate nodes per output/instance.
 * @param componentId
 * @param selectManager
 * @param selectedNodeNames
 */
const restoreSelection = (
	availableNodeNames: {[key: string]: IUseNodeInteractionDataResult},
	componentId: string,
	selectManager?: SelectManager | MultiSelectManager,
	selectedNodeNames: string[] = [],
) => {
	if (!selectManager) return;

	// deselect the nodes selected by this manager
	if (selectManager instanceof SelectManager) selectManager.deselect();
	else selectManager.deselectAll();

	const candidates = Object.values(availableNodeNames).flat();
	for (const name of selectedNodeNames) {
		const candidate = candidates.find((c) => c.name === name);
		if (!candidate) continue;
		const hasInteractionData = candidate.node.data.some(
			(data) =>
				data instanceof InteractionData &&
				data.restrictedManagers.includes(componentId),
		);
		if (hasInteractionData)
			selectManager.select({
				distance: 1,
				point: vec3.create(),
				node: candidate.node,
			});
	}
};

// #endregion Functions (1)
