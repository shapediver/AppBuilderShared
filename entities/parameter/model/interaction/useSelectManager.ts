import {parseInteractionEffect} from "@AppBuilderLib/shared/lib";
import {
	InteractionEngine,
	MultiSelectManager,
	SelectManager,
} from "@shapediver/viewer.features.interaction";
import {IInteractionEffect} from "@shapediver/viewer.features.interaction/dist/interfaces/utils/IInteractionEffectUtils";
import {
	ISelectionParameterProps,
	ITreeNode,
	MaterialStandardData,
} from "@shapediver/viewer.session";
import {
	BlendFunction,
	KernelSize,
	POST_PROCESSING_EFFECT_TYPE,
} from "@shapediver/viewer.viewport";
import {useEffect, useRef, useState} from "react";
import {useInteractionEngine} from "./useInteractionEngine";

// #region Functions (1)

// create an object to store the hover managers for each component that is assigned to a viewport
const selectManagers: {
	[key: string]: {
		[key: string]: {
			selectManager: SelectManager | MultiSelectManager;
			selectMultiple: boolean;
			token: string;
		};
	};
} = {};

/**
 * Clean up the select manager for the given viewportId and componentId.
 * We also deselect all selected nodes.
 *
 * @param viewportId - The ID of the viewport.
 * @param componentId - The ID of the component.
 * @param interactionEngine - The interaction engine instance.
 */
const cleanUpSelectManager = (
	viewportId: string,
	componentId: string,
	availableNodeData?: {
		nodes: ITreeNode[] | undefined;
		tokens: string[] | undefined;
	},
	interactionEngine?: InteractionEngine,
) => {
	if (selectManagers[viewportId][componentId]) {
		if (
			selectManagers[viewportId][componentId].selectManager instanceof
			SelectManager
		) {
			(
				selectManagers[viewportId][componentId]
					.selectManager as SelectManager
			).deselect();
		} else if (
			selectManagers[viewportId][componentId].selectManager instanceof
			MultiSelectManager
		) {
			(
				selectManagers[viewportId][componentId]
					.selectManager as MultiSelectManager
			).deselectAll();
		}

		if (
			availableNodeData &&
			availableNodeData.nodes &&
			availableNodeData.tokens
		) {
			availableNodeData.nodes.forEach((node, index) => {
				selectManagers[viewportId][
					componentId
				].selectManager!.interactionEffectUtils.removeInteractionEffect(
					node,
					availableNodeData.tokens![index],
				);
			});
		}

		if (interactionEngine && interactionEngine.closed === false)
			interactionEngine.removeInteractionManager(
				selectManagers[viewportId][componentId].token,
			);
		delete selectManagers[viewportId][componentId];
	}
};

/**
 * Hook providing select managers for viewports.
 * Use the useNodeInteractionData hook to add interaction data to nodes of the
 * scene tree and make them selectable.
 *
 * @param viewportId The ID of the viewport.
 * @param componentId The ID of the component.
 * @param settings The settings for the select manager. If the settings are not provided, the select manager will not be created.
 */
export function useSelectManager(
	viewportId: string,
	componentId: string,
	settings?: Pick<
		ISelectionParameterProps,
		| "minimumSelection"
		| "maximumSelection"
		| "selectionColor"
		| "availableColor"
		| "deselectOnEmpty"
	>,
): {
	/**
	 * The select manager that was created for the viewport.
	 * Depending on the settings, this can be a select manager or a multi select manager.
	 */
	selectManager?: SelectManager | MultiSelectManager;
	/**
	 * Set the available nodes for the select manager.
	 * These nodes will be highlighted with the available color.
	 *
	 * @param nodes - The nodes to be set as available.
	 */
	setAvailableNodes(nodes: ITreeNode[] | undefined): void;
} {
	// call the interaction engine hook
	const {interactionEngine} = useInteractionEngine(viewportId, componentId);

	// create an empty object for the select managers of the viewport
	if (!selectManagers[viewportId]) {
		selectManagers[viewportId] = {};
	}

	// define a state for the select manager
	const [selectManager, setSelectManager] = useState<
		SelectManager | MultiSelectManager | undefined
	>(undefined);

	const [availableNodes, setAvailableNodes] = useState<
		ITreeNode[] | undefined
	>(undefined);

	const [selectionEffect, setSelectionEffect] = useState<
		IInteractionEffect | undefined
	>();

	const [availableEffect, setAvailableEffect] = useState<
		IInteractionEffect | undefined
	>();

	const availableNodeDataRef = useRef<{
		nodes: ITreeNode[] | undefined;
		tokens: string[] | undefined;
	}>({
		nodes: undefined,
		tokens: undefined,
	});

	// Tracks the currently applied available effects so we can diff incrementally
	// instead of removing all effects and re-adding them whenever availableNodes changes.
	// This prevents the brief flash where all outlines disappear then reappear.
	const appliedAvailableEffectsRef = useRef<Map<ITreeNode, string>>(
		new Map(),
	);
	const prevAvailableManagerRef = useRef<
		SelectManager | MultiSelectManager | undefined
	>(undefined);
	const prevAvailableEffectRef = useRef<IInteractionEffect | undefined>(
		undefined,
	);

	useEffect(() => {
		const effect = parseInteractionEffect(settings?.selectionColor);

		effect.then((e) => {
			if (e) {
				if (e instanceof Promise) {
					e.then((e) =>
						setSelectionEffect(e as MaterialStandardData),
					);
				} else {
					setSelectionEffect(e as IInteractionEffect);
				}
			} else if (settings?.selectionColor !== null) {
				setSelectionEffect({
					properties: {
						blendFunction: BlendFunction.ALPHA,
						blur: true,
						edgeStrength: 10,
						hiddenEdgeColor: "#0d44f0",
						kernelSize: KernelSize.LARGE,
						visibleEdgeColor: "#0d44f0",
					},
					type: POST_PROCESSING_EFFECT_TYPE.OUTLINE,
				});
			} else {
				setSelectionEffect(undefined);
			}
		});
	}, [settings?.selectionColor]);

	useEffect(() => {
		const effect = parseInteractionEffect(settings?.availableColor);

		effect.then((e) => {
			if (e) {
				if (e instanceof MaterialStandardData) {
					setAvailableEffect(e);
				} else {
					setAvailableEffect(e as IInteractionEffect);
				}
			} else if (settings?.availableColor !== null) {
				setAvailableEffect({
					properties: {
						blendFunction: BlendFunction.ALPHA,
						blur: true,
						edgeStrength: 10,
						hiddenEdgeColor: "#ffffff",
						kernelSize: KernelSize.LARGE,
						pulseSpeed: 0.5,
						visibleEdgeColor: "#ffffff",
					},
					type: POST_PROCESSING_EFFECT_TYPE.OUTLINE,
				});
			} else {
				setAvailableEffect(undefined);
			}
		});
	}, [settings?.availableColor]);

	// Whenever available nodes, the available effect, or the select manager change,
	// incrementally update which nodes have the available effect applied.
	// Using a diff (add/remove only what changed) prevents the brief flash that
	// would occur if we removed all effects and re-applied them on every update.
	useEffect(() => {
		const prevManager = prevAvailableManagerRef.current;
		const prevEffect = prevAvailableEffectRef.current;
		const appliedMap = appliedAvailableEffectsRef.current;

		// When the manager or effect instance changes, clear all previously applied
		// effects using the old manager/effect before proceeding.
		if (
			(prevManager && prevManager !== selectManager) ||
			(prevEffect && prevEffect !== availableEffect)
		) {
			if (prevManager) {
				appliedMap.forEach((token, node) => {
					prevManager.interactionEffectUtils.removeInteractionEffect(
						node,
						token,
					);
				});
			}
			appliedMap.clear();
		}

		prevAvailableManagerRef.current = selectManager;
		prevAvailableEffectRef.current = availableEffect;

		if (!availableEffect || !selectManager) {
			availableNodeDataRef.current = {
				nodes: undefined,
				tokens: undefined,
			};
			return;
		}

		const newNodeSet = new Set(availableNodes ?? []);

		// Remove effect from nodes that are no longer available
		Array.from(appliedMap.entries()).forEach(([node, token]) => {
			if (!newNodeSet.has(node)) {
				selectManager.interactionEffectUtils.removeInteractionEffect(
					node,
					token,
				);
				appliedMap.delete(node);
			}
		});

		// Apply effect to newly available nodes (skip nodes already tracked)
		Array.from(newNodeSet).forEach((node) => {
			if (!appliedMap.has(node)) {
				const token =
					selectManager.interactionEffectUtils.applyInteractionEffect(
						node,
						availableEffect,
					);
				appliedMap.set(node, token);
			}
		});

		// Keep availableNodeDataRef in sync for cleanUpSelectManager
		const entries = Array.from(appliedMap.entries());
		availableNodeDataRef.current = {
			nodes: entries.map(([node]) => node),
			tokens: entries.map(([, token]) => token),
		};
	}, [availableEffect, availableNodes, selectManager]);

	// use an effect to create the select manager
	useEffect(() => {
		if (settings) {
			// whenever this output node changes, we want to create the interaction engine
			const selectMultiple =
				settings.minimumSelection !== undefined &&
				settings.maximumSelection !== undefined &&
				settings.minimumSelection <= settings.maximumSelection &&
				settings.maximumSelection > 1;

			// check if a select manager already exists for the viewport and component, but with different settings
			// in this case we need to remove the old select manager and create a new one
			if (
				selectManagers[viewportId][componentId] &&
				selectManagers[viewportId][componentId].selectMultiple !==
					selectMultiple
			) {
				cleanUpSelectManager(
					viewportId,
					componentId,
					availableNodeDataRef.current,
					interactionEngine,
				);
			}

			if (
				!selectManagers[viewportId][componentId] &&
				interactionEngine &&
				interactionEngine.closed === false
			) {
				// depending on the settings, create a select manager or a multi select manager
				if (selectMultiple) {
					// create a multi select manager with the given settings
					const selectManager = new MultiSelectManager(
						componentId,
						selectionEffect,
						settings.minimumSelection!,
						settings.maximumSelection!,
					);
					selectManager.deselectOnEmpty =
						settings.deselectOnEmpty ?? false;

					const token =
						interactionEngine.addInteractionManager(selectManager);
					selectManagers[viewportId][componentId] = {
						selectManager,
						token,
						selectMultiple,
					};
					setSelectManager(selectManager);
				} else {
					// create a select manager with the given settings
					const selectManager = new SelectManager(
						componentId,
						selectionEffect,
					);
					selectManager.deselectOnEmpty =
						settings.deselectOnEmpty ?? false;

					const token =
						interactionEngine.addInteractionManager(selectManager);
					selectManagers[viewportId][componentId] = {
						selectManager,
						token,
						selectMultiple,
					};
					setSelectManager(selectManager);
				}
			}

			if (!selectManagers[viewportId][componentId]) {
				setSelectManager(undefined);
			}
		}

		return () => {
			// clean up the select manager
			if (selectManagers[viewportId][componentId]) {
				cleanUpSelectManager(
					viewportId,
					componentId,
					availableNodeDataRef.current,
					interactionEngine,
				);
				setSelectManager(undefined);
			}
		};
	}, [interactionEngine, settings, selectionEffect]);

	return {
		selectManager,
		setAvailableNodes,
	};
}

// #endregion Functions (1)
