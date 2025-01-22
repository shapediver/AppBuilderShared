import { useShapeDiverStoreViewport } from "@AppBuilderShared/store/useShapeDiverStoreViewport";
import { InteractionEngine } from "@shapediver/viewer.features.interaction";
import { useEffect } from "react";

// #region Functions (1)

// create an object to store the interaction engines for the viewports
const interactionEngines: { [key: string]: InteractionEngine } = {};

/**
 * Hook allowing to create an interaction engine for a viewport.
 *
 * @param viewportId
 */
export function useInteractionEngine(viewportId: string): {
	/**
	 * The interaction engine that was created for the viewport.
	 */
	interactionEngine?: InteractionEngine
} {
	// get the viewport API
	const viewportApi = useShapeDiverStoreViewport(state => { return state.viewports[viewportId]; });

	// use an effect to create the interaction engine
	useEffect(() => {
		if (viewportApi) {
			if (!interactionEngines[viewportId]) {
				// create the interaction engine
				const interactionEngine = new InteractionEngine(viewportApi);
				interactionEngines[viewportId] = interactionEngine;
			}
		}

		return () => {
			// clean up the interaction engine
			if (interactionEngines[viewportId]) {
				interactionEngines[viewportId].close();
				delete interactionEngines[viewportId];
			}
		};
	}, [viewportApi]);

	return {
		interactionEngine: interactionEngines[viewportId]
	};
}

// #endregion Functions (1)
