import {
	InteractionEventResponseMapping,
	matchNodesWithPatterns,
	MultiSelectManager,
	SelectManager,
} from "@shapediver/viewer.features.interaction";
import {
	addListener,
	EVENTTYPE_INTERACTION,
	IEvent,
	ITreeNode,
	removeListener,
} from "@shapediver/viewer.session";
import {useCallback, useEffect, useRef, useState} from "react";
import {IUseCreateNameFilterPatternResult} from "./useCreateNameFilterPattern";

// #region Functions (1)

/** State of selected node names and corresponding actions. */
export interface ISelectionState {
	/**
	 * The selected node names.
	 */
	selectedNodeNames: string[];
	/**
	 * Set the selected node names.
	 *
	 * @param names
	 * @returns
	 */
	setSelectedNodeNames: (names: string[]) => void;
	/**
	 * Callback function to reset (clear) the selected node names.
	 *
	 * @returns
	 */
	resetSelectedNodeNames: () => void;
}

const getNodeNames = (
	patterns: IUseCreateNameFilterPatternResult,
	selected: ITreeNode[],
	strictNaming: boolean,
) => {
	const nodeNames = [];

	for (const sessionId in patterns.outputPatterns) {
		const pattern = patterns.outputPatterns[sessionId];
		nodeNames.push(
			...matchNodesWithPatterns(pattern, selected, strictNaming),
		);
	}

	if (patterns.instancePatterns) {
		const pattern = patterns.instancePatterns;
		nodeNames.push(
			...matchNodesWithPatterns(pattern, selected, strictNaming),
		);
	}

	return nodeNames;
};

/**
 * This hook registers to selection events and provides a state of selected node names
 * according to the provided filter pattern.
 *
 * @param patterns The pattern to match the hovered nodes.
 * @param componentId The ID of the component.
 * @param initialSelectedNodeNames The initial selected node names (used to initialize the selection state).
 * 					Note that this initial state is not checked against the filter pattern.
 * @param strictNaming Whether to use strict naming for node name matching.
 */
export function useSelectManagerEvents(
	patterns: IUseCreateNameFilterPatternResult,
	componentId: string,
	initialSelectedNodeNames?: string[],
	strictNaming = true,
	active = true,
	selectManager?: SelectManager | MultiSelectManager,
): ISelectionState {
	// A select manager is disposed while an interaction is suspended. Disposal
	// emits selection-off events asynchronously, so keep the current activity in
	// a ref and ignore events from that stale manager. Without this guard a
	// persistent selection can restore its names on resume and then immediately
	// have them cleared by the manager it just disposed.
	const activeRef = useRef(active);
	activeRef.current = active;
	const selectManagerRef = useRef(selectManager);
	selectManagerRef.current = selectManager;

	// state for the selected nodes
	const [selectedNodeNames, setSelectedNodeNames] = useState<string[]>(
		initialSelectedNodeNames ?? [],
	);
	const resetSelectedNodeNames = useCallback(
		() => setSelectedNodeNames([]),
		[],
	);

	// register an event handler and listen for output updates
	useEffect(() => {
		/**
		 * Event handler for the select on event.
		 * In this event handler, the selected node names are updated.
		 */
		const tokenSelectOn = addListener(
			EVENTTYPE_INTERACTION.SELECT_ON,
			async (event: IEvent) => {
				const selectEvent =
					event as InteractionEventResponseMapping[EVENTTYPE_INTERACTION.SELECT_ON];

				// We ignore the event if it's not based on an event triggered by the UI.
				if (!activeRef.current || !selectEvent.event) return;
				// We ignore the event if it's not based on the component ID.
				if (
					selectEvent.manager.id !== componentId ||
					selectEvent.manager !== selectManagerRef.current
				)
					return;

				const selected = [selectEvent.node];
				const names = getNodeNames(patterns, selected, strictNaming);
				setSelectedNodeNames(names);
			},
		);

		/**
		 * Event handler for the select off event.
		 * In this event handler, the selected node names are updated.
		 */
		const tokenSelectOff = addListener(
			EVENTTYPE_INTERACTION.SELECT_OFF,
			async (event: IEvent) => {
				const selectEvent =
					event as InteractionEventResponseMapping[EVENTTYPE_INTERACTION.SELECT_OFF];

				// don't send the event if it is a reselection
				if (!activeRef.current || selectEvent.reselection) return;
				// We ignore the event if it's not based on an event triggered by the UI.
				if (!selectEvent.event) return;
				// We ignore the event if it's not based on the component ID.
				if (
					selectEvent.manager.id !== componentId ||
					selectEvent.manager !== selectManagerRef.current
				)
					return;

				setSelectedNodeNames([]);
			},
		);

		/**
		 * Event handler for the multi select on event.
		 * In this event handler, the selected node names are updated.
		 */
		const tokenMultiSelectOn = addListener(
			EVENTTYPE_INTERACTION.MULTI_SELECT_ON,
			async (event: IEvent) => {
				const multiSelectEvent =
					event as InteractionEventResponseMapping[EVENTTYPE_INTERACTION.MULTI_SELECT_ON];

				// We ignore the event if it's not based on an event triggered by the UI.
				if (!activeRef.current || !multiSelectEvent.event) return;
				// We ignore the event if it's not based on the component ID.
				if (
					multiSelectEvent.manager.id !== componentId ||
					multiSelectEvent.manager !== selectManagerRef.current
				)
					return;

				// Snapshot the nodes array immediately (it may be a live reference).
				const selected = [...multiSelectEvent.nodes];
				const names = getNodeNames(patterns, selected, strictNaming);
				setSelectedNodeNames(names);
			},
		);

		/**
		 * Event handler for the multi select off event.
		 * In this event handler, the selected node names are updated.
		 */
		const tokenMultiSelectOff = addListener(
			EVENTTYPE_INTERACTION.MULTI_SELECT_OFF,
			async (event: IEvent) => {
				const multiSelectEvent =
					event as InteractionEventResponseMapping[EVENTTYPE_INTERACTION.MULTI_SELECT_OFF];

				// We ignore the event if it's not based on an event triggered by the UI.
				if (!activeRef.current || !multiSelectEvent.event) return;
				// We ignore the event if it's not based on the component ID.
				if (
					multiSelectEvent.manager.id !== componentId ||
					multiSelectEvent.manager !== selectManagerRef.current
				)
					return;

				// remove the node from the selected nodes
				const selected = multiSelectEvent.nodes;
				setSelectedNodeNames(
					getNodeNames(patterns, selected, strictNaming),
				);
			},
		);

		/**
		 * Remove the event listeners when the component is unmounted.
		 */
		return () => {
			removeListener(tokenSelectOn);
			removeListener(tokenSelectOff);
			removeListener(tokenMultiSelectOn);
			removeListener(tokenMultiSelectOff);
		};
	}, [patterns, componentId, strictNaming]);

	return {
		selectedNodeNames,
		setSelectedNodeNames,
		resetSelectedNodeNames,
	};
}

// #endregion Functions (1)
