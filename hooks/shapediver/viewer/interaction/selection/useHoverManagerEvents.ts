import { addListener, EVENTTYPE_INTERACTION, IEvent, removeListener } from "@shapediver/viewer.session";
import { InteractionEventResponseMapping, matchNodesWithPatterns, OutputNodeNameFilterPatterns } from "@shapediver/viewer.features.interaction";
import { useState, useEffect } from "react";

// #region Functions (1)

/**
 * Hook allowing to create the hover manager events.
 * 
 * @param pattern The pattern to match the hovered nodes.
 * @param componentId The ID of the component.
 */
export function useHoverManagerEvents(
	pattern: OutputNodeNameFilterPatterns,
	componentId: string,
	strictNaming = true
): {
	/**
	 * The hovered node names.
	 */
    hoveredNodeNames: string[]
} {
	// state for the hovered nodes
	const [hoveredNodeNames, setHoveredNodeNames] = useState<string[]>([]);

	// register an event handler and listen for output updates
	useEffect(() => {
		/**
         * Event handler for the hover on event.
         * In this event handler, the hovered node names are updated.
         */
		const tokenHoverOn = addListener(EVENTTYPE_INTERACTION.HOVER_ON, async (event: IEvent) => {
			const hoverEvent = event as InteractionEventResponseMapping[EVENTTYPE_INTERACTION.HOVER_ON];

			// We ignore the event if it's not based on an event triggered by the UI.
			if (!hoverEvent.event) return;
			// We ignore the event if it's not based on the component ID.
			if (hoverEvent.manager.id !== componentId) return;

			const hovered = [hoverEvent.node];
			const nodeNames = matchNodesWithPatterns(pattern, hovered, strictNaming);
			setHoveredNodeNames(nodeNames);
		});

		/**
         * Event handler for the hover off event.
         * In this event handler, the hovered node names are updated.
         */
		const tokenHoverOff = addListener(EVENTTYPE_INTERACTION.HOVER_OFF, async (event: IEvent) => {
			const hoverEvent = event as InteractionEventResponseMapping[EVENTTYPE_INTERACTION.HOVER_OFF];

			// We ignore the event if it's not based on an event triggered by the UI.
			if (!hoverEvent.event) return;
			// We ignore the event if it's not based on the component ID.
			if (hoverEvent.manager.id !== componentId) return;

			setHoveredNodeNames([]);
		});

		/**
         * Remove the event listeners when the component is unmounted.
         */
		return () => {
			removeListener(tokenHoverOn);
			removeListener(tokenHoverOff);
		};
	}, [pattern, componentId]);

	return {
		hoveredNodeNames
	};
}

// #endregion Functions (1)
