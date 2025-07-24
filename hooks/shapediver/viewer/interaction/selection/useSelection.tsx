import {useHoverManager} from "@AppBuilderShared/hooks/shapediver/viewer/interaction/selection/useHoverManager";
import {useSelectManager} from "@AppBuilderShared/hooks/shapediver/viewer/interaction/selection/useSelectManager";
import {
	ISelectionState,
	useSelectManagerEvents,
} from "@AppBuilderShared/hooks/shapediver/viewer/interaction/selection/useSelectManagerEvents";
import {useCreateNameFilterPattern} from "@AppBuilderShared/hooks/shapediver/viewer/interaction/useCreateNameFilterPattern";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {
	checkNodeNameMatch,
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
import {
	IUseNodeInteractionDataProps,
	IUseNodeInteractionDataResult,
	useNodesInteractionData,
} from "../useNodeInteractionData";

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
	const {selectManager} = useSelectManager(
		viewportId,
		componentId,
		activate ? selectionProps : undefined,
	);

	// store the select manager in a ref
	const selectManagerRef = React.useRef<SelectManager | MultiSelectManager>();
	useEffect(() => {
		selectManagerRef.current = selectManager;
	}, [selectManager]);

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
						nodesInteractionInput[`${sessionId}_${outputId}`] = {
							sessionId,
							componentId,
							outputId,
							patterns: pattern,
							interactionSettings: {
								select: true,
								hover: selectionProps.hover,
							},
							selectManager,
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
						selectManager,
						strictNaming,
					};
				},
			);
		}

		return nodesInteractionInput;
	}, [patterns, selectionProps, selectManager]);

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

	// when the available node names change, we need to update the selected node names
	// to ensure that the selected nodes are still available
	useEffect(() => {
		const newSelectedNodeNames: string[] = [];
		if (selectedNodeNames.length > 0 && availableNodeNames) {
			selectedNodeNames.forEach((name) => {
				Object.values(availableNodeNames).forEach((availableNames) => {
					if (availableNames.includes(name)) {
						newSelectedNodeNames.push(name);
					}
				});
			});
		}

		setSelectedNodeNames(newSelectedNodeNames);
	}, [availableNodeNames]);

	// in case selection becomes active or the output node changes, restore the selection status
	useEffect(() => {
		if (!selectManager) return;

		restoreSelection(
			outputsPerSession,
			componentId,
			selectManager,
			selectedNodeNames,
			strictNaming,
		);
	}, [outputsPerSession, componentId, selectManager]);

	// we need to return the available node names in a dictionary for each output
	// therefore we need to transform the availableNodeNames object into a dictionary
	// with session and output IDs as keys
	const availableNodeNamesReturn = useMemo(() => {
		const availableNodeNamesPerOutput: {
			[key: string]: {[key: string]: IUseNodeInteractionDataResult};
		} = {};

		Object.entries(availableNodeNames).forEach(([key, value]) => {
			const [sessionId, outputId] = key.split("_");
			if (!availableNodeNamesPerOutput[sessionId])
				availableNodeNamesPerOutput[sessionId] = {};
			availableNodeNamesPerOutput[sessionId][outputId] = value;
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
				componentId,
				selectManagerRef.current,
				names,
				strictNaming,
			);
		},
		[componentId],
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
		if (!outputApi) return;
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
		if (outputApi.name !== parts[0]) return;

		if (parts.length === 1) {
			// special case if only the output name is given
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
			// if the node name matches the pattern, select the node
			node.traverse((n) => {
				if (
					checkNodeNameMatch(
						n,
						parts.slice(1).join("."),
						strictNaming,
					)
				) {
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
