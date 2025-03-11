import {useInteractionEngine} from "@AppBuilderShared/hooks/shapediver/viewer/interaction/useInteractionEngine";
import {
	HoverManager,
	InteractionEngine,
} from "@shapediver/viewer.features.interaction";
import {
	IInteractionParameterProps,
	MaterialStandardData,
} from "@shapediver/viewer.session";
import {useEffect, useState} from "react";

// #region Functions (1)

// create an object to store the hover managers for each component that is assigned to a viewport
const hoverManagers: {
	[key: string]: {
		[key: string]: {
			hoverManager: HoverManager;
			token: string;
		};
	};
} = {};

/**
 * Clean up the hover manager for the given viewportId and componentId.
 *
 * @param viewportId - The ID of the viewport.
 * @param componentId - The ID of the component.
 * @param interactionEngine - The interaction engine instance.
 */
const cleanUpHoverManager = (
	viewportId: string,
	componentId: string,
	interactionEngine?: InteractionEngine,
) => {
	if (hoverManagers[viewportId][componentId]) {
		if (interactionEngine && interactionEngine.closed === false)
			interactionEngine.removeInteractionManager(
				hoverManagers[viewportId][componentId].token,
			);
		delete hoverManagers[viewportId][componentId];
	}
};

/**
 * Hook providing hover managers for viewports.
 * Use the useNodeInteractionData hook to add interaction data to nodes of the
 * scene tree and make them hoverable.
 *
 * @param viewportId The ID of the viewport.
 * @param componentId The ID of the component.
 * @param settings The settings for the hover manager. If the settings are not provided, the hover manager will not be created.
 */
export function useHoverManager(
	viewportId: string,
	componentId: string,
	settings?: Pick<IInteractionParameterProps, "hoverColor">,
): {
	/**
	 * The hover manager that was created for the viewport.
	 */
	hoverManager?: HoverManager;
} {
	// call the interaction engine hook
	const {interactionEngine} = useInteractionEngine(viewportId);

	// create an empty object for the hover managers of the viewport
	if (!hoverManagers[viewportId]) {
		hoverManagers[viewportId] = {};
	}

	// define a state for the select manager
	const [hoverManager, setHoverManager] = useState<HoverManager | undefined>(
		undefined,
	);

	// use an effect to create the hover manager
	useEffect(() => {
		if (
			settings &&
			interactionEngine &&
			interactionEngine.closed === false &&
			!hoverManagers[viewportId][componentId]
		) {
			// create the hover manager with the given settings
			const hoverManager = new HoverManager(
				componentId,
				new MaterialStandardData({
					color: settings.hoverColor || "#00ff78",
				}),
			);
			const token = interactionEngine.addInteractionManager(hoverManager);
			hoverManagers[viewportId][componentId] = {hoverManager, token};
			setHoverManager(
				hoverManagers[viewportId][componentId].hoverManager,
			);
		}

		return () => {
			// clean up the hover manager
			if (hoverManagers[viewportId][componentId]) {
				cleanUpHoverManager(viewportId, componentId, interactionEngine);
				setHoverManager(undefined);
			}
		};
	}, [interactionEngine, settings]);

	return {
		hoverManager,
	};
}

// #endregion Functions (1)
