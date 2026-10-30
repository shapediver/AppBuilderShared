import {useShapeDiverStoreViewport} from "@AppBuilderLib/entities/viewport/model/useShapeDiverStoreViewport";
import {InteractionEngine} from "@shapediver/viewer.features.interaction";
import {useEffect, useId, useState} from "react";

// #region Functions (2)

// create an object to store the interaction engines for the viewports
const interactionEngines: {
	[key: string]: {
		engine: InteractionEngine;
		components: string[];
	};
} = {};

// the components requesting a pause of the interaction engine of a viewport
// (see useInteractionEnginePause)
const pauseRequests: {[viewportId: string]: Set<string>} = {};

/** Pause the interaction engine of a viewport while a pause is requested. */
const applyPauseRequests = (viewportId: string) => {
	const entry = interactionEngines[viewportId];
	if (!entry || entry.engine.closed) return;
	if ((pauseRequests[viewportId]?.size ?? 0) > 0) entry.engine.pause();
	else entry.engine.continue();
};

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
				// editing is paused during a computation (see also
				// useInteractionEnginePause)
				const e = new InteractionEngine(viewportApi, {
					pauseWhileBusy: true,
				});
				interactionEngines[viewportId] = {
					engine: e,
					components: [componentId],
				};
				applyPauseRequests(viewportId);
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
				const idx =
					interactionEngines[viewportId].components.indexOf(
						componentId,
					);
				if (idx !== -1) {
					interactionEngines[viewportId].components.splice(idx, 1);
				}

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

/**
 * Pause the interaction engine of a viewport (selection, hovering, dragging)
 * while `paused` is true, e.g. while a computation runs (busy mode, like the
 * disabled inputs of the other parameters): the selection is kept, a drag in
 * progress is cancelled, the camera keeps working. The engine is shared by
 * the components of the viewport, it is paused while any of them requests it.
 *
 * @param viewportId The viewport whose interaction engine is paused.
 * @param paused Whether the pause is requested.
 */
export function useInteractionEnginePause(
	viewportId: string,
	paused: boolean,
): void {
	const componentId = useId();

	useEffect(() => {
		if (!paused) return;
		(pauseRequests[viewportId] ??= new Set()).add(componentId);
		applyPauseRequests(viewportId);

		return () => {
			pauseRequests[viewportId]?.delete(componentId);
			if (pauseRequests[viewportId]?.size === 0)
				delete pauseRequests[viewportId];
			applyPauseRequests(viewportId);
		};
	}, [viewportId, paused, componentId]);
}

// #endregion Functions (2)
