import {useShapeDiverStoreViewport} from "@AppBuilderShared/store/useShapeDiverStoreViewport";
import {InteractionEngine} from "@shapediver/viewer.features.interaction";
import {useEffect, useState} from "react";

// #region Functions (1)

// create an object to store the interaction engines for the viewports
const interactionEngines: {
	[key: string]: {
		engine: InteractionEngine;
		components: string[];
	};
} = {};

/**
 * Hook allowing to create an interaction engine for a viewport.
 *
 * @param viewportId
 */
export function useInteractionEngine(
	viewportId: string,
	componentId: string,
): {
	/**
	 * The interaction engine that was created for the viewport.
	 */
	interactionEngine?: InteractionEngine;
} {
	// get the viewport API
	const viewportApi = useShapeDiverStoreViewport((state) => {
		return state.viewports[viewportId];
	});

	// define a state for the select manager
	const [interactionEngine, setInteractionEngine] = useState<
		InteractionEngine | undefined
	>(undefined);

	// use an effect to create the interaction engine
	useEffect(() => {
		if (viewportApi) {
			if (
				!interactionEngines[viewportId] ||
				interactionEngines[viewportId].engine.closed
			) {
				// create the interaction engine
				const e = new InteractionEngine(viewportApi);
				interactionEngines[viewportId] = {
					engine: e,
					components: [componentId],
				};
				setInteractionEngine(e);
			} else {
				// if the interaction engine already exists, we just add the component ID
				interactionEngines[viewportId].components.push(componentId);
				// if the interaction engine already exists, we just set it
				setInteractionEngine(interactionEngines[viewportId].engine);
			}
		}

		return () => {
			// clean up the interaction engine
			if (interactionEngines[viewportId]) {
				interactionEngines[viewportId].components.splice(
					interactionEngines[viewportId].components.indexOf(
						componentId,
					),
					1,
				);

				if (interactionEngines[viewportId].components.length === 0) {
					interactionEngines[viewportId].engine.close();
					delete interactionEngines[viewportId];
				}
				setInteractionEngine(undefined);
			}
		};
	}, [viewportApi, componentId]);

	return {
		interactionEngine,
	};
}

// #endregion Functions (1)
