import {
	InteractionEventResponseMapping,
	matchNodesWithPatterns,
} from "@shapediver/viewer.features.interaction";
import {
	addListener,
	EVENTTYPE_INTERACTION,
	IEvent,
	ITreeNode,
	removeListener,
} from "@shapediver/viewer.session";
import {useCallback, useEffect, useState} from "react";
import {IUseCreateNameFilterPatternResult} from "../useCreateNameFilterPattern";

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
 */
export function useSelectManagerEvents(
	patterns: IUseCreateNameFilterPatternResult,
	componentId: string,
	initialSelectedNodeNames?: string[],
	strictNaming = true,
): ISelectionState {
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
				if (!selectEvent.event) return;
				// We ignore the event if it's not based on the component ID.
				if (selectEvent.manager.id !== componentId) return;

				const selected = [selectEvent.node];
				setSelectedNodeNames(
					getNodeNames(patterns, selected, strictNaming),
				);
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
				if (selectEvent.reselection) return;
				// We ignore the event if it's not based on an event triggered by the UI.
				if (!selectEvent.event) return;
				// We ignore the event if it's not based on the component ID.
				if (selectEvent.manager.id !== componentId) return;

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
				if (!multiSelectEvent.event) return;
				// We ignore the event if it's not based on the component ID.
				if (multiSelectEvent.manager.id !== componentId) return;

				const selected = multiSelectEvent.nodes;
				setSelectedNodeNames(
					getNodeNames(patterns, selected, strictNaming),
				);
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
				if (!multiSelectEvent.event) return;
				// We ignore the event if it's not based on the component ID.
				if (multiSelectEvent.manager.id !== componentId) return;

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
	}, [patterns, componentId]);

	return {
		selectedNodeNames,
		setSelectedNodeNames,
		resetSelectedNodeNames,
	};
}

// #endregion Functions (1)
