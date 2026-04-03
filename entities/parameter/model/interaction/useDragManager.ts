import {parseInteractionEffect} from "@AppBuilderLib/shared/lib";
import {
	DragManager,
	InteractionEngine,
} from "@shapediver/viewer.features.interaction";
import {IInteractionEffect} from "@shapediver/viewer.features.interaction/dist/interfaces/utils/IInteractionEffectUtils";
import {
	IDraggingParameterProps,
	ITreeNode,
	MaterialStandardData,
} from "@shapediver/viewer.session";
import {
	BlendFunction,
	KernelSize,
	POST_PROCESSING_EFFECT_TYPE,
} from "@shapediver/viewer.viewport";
import {useCallback, useEffect, useRef, useState} from "react";
import {useInteractionEngine} from "./useInteractionEngine";

// #region Functions (1)

// create an object to store the drag managers for each component that is assigned to a viewport
const dragManagers: {
	[key: string]: {
		[key: string]: {
			dragManager: DragManager;
			token: string;
		};
	};
} = {};

/**
 * Clean up the drag manager for the given viewportId and componentId.
 *
 * @param viewportId - The ID of the viewport.
 * @param componentId - The ID of the component.
 * @param interactionEngine - The interaction engine instance.
 */
const cleanUpDragManager = (
	viewportId: string,
	componentId: string,
	appliedEffects?: Map<ITreeNode, string>,
	interactionEngine?: InteractionEngine,
) => {
	if (dragManagers[viewportId][componentId]) {
		if (appliedEffects) {
			appliedEffects.forEach((token, node) => {
				dragManagers[viewportId][
					componentId
				].dragManager!.interactionEffectUtils.removeInteractionEffect(
					node,
					token,
				);
			});
		}
		if (interactionEngine && interactionEngine.closed === false)
			interactionEngine.removeInteractionManager(
				dragManagers[viewportId][componentId].token,
			);
		delete dragManagers[viewportId][componentId];
	}
};

/**
 * Hook providing drag managers for viewports.
 * Use the useNodeInteractionData hook to add interaction data to nodes of the
 * scene tree and make them draggable.
 *
 * @param viewportId The ID of the viewport.
 * @param componentId The ID of the component.
 * @param settings The settings for the drag manager. If the settings are not provided, the drag manager will not be created.
 */
export function useDragManager(
	viewportId: string,
	componentId: string,
	settings?: Pick<
		IDraggingParameterProps,
		"draggingColor" | "availableColor"
	>,
): {
	/**
	 * The drag manager that was created for the viewport.
	 */
	dragManager?: DragManager;
	/**
	 * Set the available nodes for the select manager.
	 * These nodes will be highlighted with the available color.
	 *
	 * @param nodes - The nodes to be set as available.
	 */
	setAvailableNodes(nodes: ITreeNode[] | undefined): void;
	/**
	 * Synchronously remove the available interaction effect from the given nodes.
	 */
	removeAvailableEffectsForNodes(nodes: ITreeNode[]): void;
} {
	// call the interaction engine hook
	const {interactionEngine} = useInteractionEngine(viewportId, componentId);

	// create an empty object for the drag managers of the viewport
	if (!dragManagers[viewportId]) {
		dragManagers[viewportId] = {};
	}

	// define a state for the drag manager
	const [dragManager, setDragManager] = useState<DragManager | undefined>(
		undefined,
	);
	const [availableNodes, setAvailableNodes] = useState<
		ITreeNode[] | undefined
	>(undefined);

	const [draggingEffect, setDraggingEffect] = useState<
		IInteractionEffect | undefined
	>();

	const [availableEffect, setAvailableEffect] = useState<
		IInteractionEffect | undefined
	>();

	// Tracks the currently applied available effects so we can diff incrementally
	const appliedAvailableEffectsRef = useRef<Map<ITreeNode, string>>(
		new Map(),
	);
	const prevAvailableManagerRef = useRef<DragManager | undefined>(undefined);
	const prevAvailableEffectRef = useRef<
		IInteractionEffect | MaterialStandardData | undefined
	>(undefined);

	useEffect(() => {
		let cancelled = false;
		const effect = parseInteractionEffect(settings?.draggingColor);

		effect.then((e) => {
			if (cancelled) return;
			if (e) {
				if (e instanceof Promise) {
					e.then((resolved) => {
						if (cancelled) return;
						const newEffect = resolved as MaterialStandardData;
						setDraggingEffect((prev) =>
							JSON.stringify(prev) === JSON.stringify(newEffect)
								? prev
								: newEffect,
						);
					});
				} else {
					const newEffect = e as IInteractionEffect;
					setDraggingEffect((prev) =>
						JSON.stringify(prev) === JSON.stringify(newEffect)
							? prev
							: newEffect,
					);
				}
			} else if (
				settings !== undefined &&
				settings.draggingColor !== null
			) {
				const defaultPurple: IInteractionEffect = {
					properties: {
						blendFunction: BlendFunction.ALPHA,
						blur: true,
						edgeStrength: 10,
						hiddenEdgeColor: "#9e27d8",
						kernelSize: KernelSize.LARGE,
						visibleEdgeColor: "#9e27d8",
						xRay: true,
					},
					type: POST_PROCESSING_EFFECT_TYPE.OUTLINE,
				} as IInteractionEffect;
				setDraggingEffect((prev) =>
					JSON.stringify(prev) === JSON.stringify(defaultPurple)
						? prev
						: defaultPurple,
				);
			} else {
				setDraggingEffect(undefined);
			}
		});

		return () => {
			cancelled = true;
		};
	}, [settings?.draggingColor, settings !== undefined]);

	useEffect(() => {
		let cancelled = false;
		const effect = parseInteractionEffect(settings?.availableColor);

		effect.then((e) => {
			if (cancelled) return;
			if (e) {
				if (e instanceof MaterialStandardData) {
					setAvailableEffect((prev) => (prev === e ? prev : e));
				} else {
					const newEffect = e as IInteractionEffect;
					setAvailableEffect((prev) =>
						JSON.stringify(prev) === JSON.stringify(newEffect)
							? prev
							: newEffect,
					);
				}
			} else if (
				settings !== undefined &&
				settings.availableColor !== null
			) {
				const defaultWhite: IInteractionEffect = {
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
				} as IInteractionEffect;
				setAvailableEffect((prev) =>
					JSON.stringify(prev) === JSON.stringify(defaultWhite)
						? prev
						: defaultWhite,
				);
			} else {
				setAvailableEffect(undefined);
			}
		});

		return () => {
			cancelled = true;
		};
	}, [settings?.availableColor, settings !== undefined]);

	// Incremental diff effect for available nodes
	useEffect(() => {
		const appliedMap = appliedAvailableEffectsRef.current;
		const prevManager = prevAvailableManagerRef.current;
		const prevEffect = prevAvailableEffectRef.current;

		prevAvailableManagerRef.current = dragManager;
		prevAvailableEffectRef.current = availableEffect;

		const managerChanged = prevManager !== dragManager;
		const effectChanged = prevEffect !== availableEffect;

		// When the manager or effect instance changes, clear all previously applied
		// effects using the old manager/effect before proceeding.
		if ((prevManager && managerChanged) || (prevEffect && effectChanged)) {
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

		if (!availableEffect || !dragManager) {
			return;
		}

		const newNodeSet = new Set(availableNodes ?? []);

		// Remove effects for nodes no longer in the set
		Array.from(appliedMap.entries()).forEach(([node, token]) => {
			if (!newNodeSet.has(node)) {
				dragManager.interactionEffectUtils.removeInteractionEffect(
					node,
					token,
				);
				appliedMap.delete(node);
			}
		});

		// Add effects for newly added nodes
		newNodeSet.forEach((node) => {
			if (!appliedMap.has(node)) {
				const token =
					dragManager.interactionEffectUtils.applyInteractionEffect(
						node,
						availableEffect,
					);
				appliedMap.set(node, token);
			}
		});
	}, [availableEffect, availableNodes, dragManager]);

	// A ref to the current drag manager
	const dragManagerCurrentRef = useRef<DragManager | undefined>(undefined);
	useEffect(() => {
		dragManagerCurrentRef.current = dragManager;
	}, [dragManager]);

	// Stable callback that removes available outline effect from specific nodes synchronously
	const removeAvailableEffectsForNodes = useCallback((nodes: ITreeNode[]) => {
		const mgr = dragManagerCurrentRef.current;
		const appliedMap = appliedAvailableEffectsRef.current;
		if (!mgr) return;
		nodes.forEach((node) => {
			const token = appliedMap.get(node);
			if (token !== undefined) {
				mgr.interactionEffectUtils.removeInteractionEffect(node, token);
				appliedMap.delete(node);
			}
		});
	}, []);

	const settingsDefined = settings !== undefined;

	// use an effect to create the drag manager
	useEffect(() => {
		if (
			settings &&
			interactionEngine &&
			interactionEngine.closed === false &&
			!dragManagers[viewportId][componentId]
		) {
			const dragManager = new DragManager(componentId, draggingEffect);
			const token = interactionEngine.addInteractionManager(dragManager);
			dragManagers[viewportId][componentId] = {dragManager, token};
			setDragManager(dragManagers[viewportId][componentId].dragManager);
		}

		return () => {
			if (dragManagers[viewportId][componentId]) {
				cleanUpDragManager(
					viewportId,
					componentId,
					appliedAvailableEffectsRef.current,
					interactionEngine,
				);
				appliedAvailableEffectsRef.current.clear();
				prevAvailableManagerRef.current = undefined;
				prevAvailableEffectRef.current = undefined;
				setDragManager(undefined);
			}
		};
	}, [interactionEngine, settingsDefined, draggingEffect]);

	return {
		dragManager,
		setAvailableNodes,
		removeAvailableEffectsForNodes,
	};
}

// #endregion Functions (1)
