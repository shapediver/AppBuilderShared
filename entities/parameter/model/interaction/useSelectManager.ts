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
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
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
	appliedEffects?: Map<ITreeNode, string>,
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

		if (appliedEffects) {
			appliedEffects.forEach((token, node) => {
				selectManagers[viewportId][
					componentId
				].selectManager!.interactionEffectUtils.removeInteractionEffect(
					node,
					token,
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
	/**
	 * Synchronously remove the available interaction effect from the given nodes.
	 * Call this while the nodes are still live (before they are replaced after a
	 * computation update) so that the post-processing reference count is properly
	 * decremented.
	 */
	removeAvailableEffectsForNodes(nodes: ITreeNode[]): void;
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
		let cancelled = false;
		const effect = parseInteractionEffect(settings?.selectionColor);

		effect.then((e) => {
			if (cancelled) return;
			if (e) {
				if (e instanceof Promise) {
					e.then((resolved) => {
						if (cancelled) return;
						const newEffect = resolved as MaterialStandardData;
						setSelectionEffect((prev) =>
							JSON.stringify(prev) === JSON.stringify(newEffect)
								? prev
								: newEffect,
						);
					});
				} else {
					const newEffect = e as IInteractionEffect;
					setSelectionEffect((prev) =>
						JSON.stringify(prev) === JSON.stringify(newEffect)
							? prev
							: newEffect,
					);
				}
			} else if (
				settings !== undefined &&
				settings.selectionColor !== null
			) {
				const defaultBlue: IInteractionEffect = {
					properties: {
						blendFunction: BlendFunction.ALPHA,
						blur: true,
						edgeStrength: 10,
						hiddenEdgeColor: "#0d44f0",
						kernelSize: KernelSize.LARGE,
						visibleEdgeColor: "#0d44f0",
					},
					type: POST_PROCESSING_EFFECT_TYPE.OUTLINE,
				} as IInteractionEffect;
				setSelectionEffect((prev) =>
					JSON.stringify(prev) === JSON.stringify(defaultBlue)
						? prev
						: defaultBlue,
				);
			} else {
				setSelectionEffect(undefined);
			}
		});

		return () => {
			cancelled = true;
		};
	}, [settings?.selectionColor, settings !== undefined]);

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

	// Whenever available nodes, the available effect, or the select manager change,
	// incrementally update which nodes have the available effect applied.
	// Using a diff (add/remove only what changed) prevents the brief flash that
	// would occur if we removed all effects and re-applied them on every update.
	useEffect(() => {
		const prevManager = prevAvailableManagerRef.current;
		const prevEffect = prevAvailableEffectRef.current;
		const appliedMap = appliedAvailableEffectsRef.current;

		const managerChanged = prevManager !== selectManager;
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

		prevAvailableManagerRef.current = selectManager;
		prevAvailableEffectRef.current = availableEffect;

		if (!availableEffect || !selectManager) {
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
	}, [availableEffect, availableNodes, selectManager]);

	// A ref to the current select manager so the removeAvailableEffectsForNodes
	// callback stays stable (no React deps) while always using the latest manager.
	const selectManagerCurrentRef = useRef<
		SelectManager | MultiSelectManager | undefined
	>(undefined);
	useEffect(() => {
		selectManagerCurrentRef.current = selectManager;
	}, [selectManager]);

	// Stable callback (no deps — uses only refs) that removes the available outline
	// effect from specific nodes synchronously. This must be called while the nodes
	// are still live in the viewer scene, before they are replaced after computation.
	const removeAvailableEffectsForNodes = useCallback((nodes: ITreeNode[]) => {
		const mgr = selectManagerCurrentRef.current;
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

	// Hoist selectMultiple so it can be used as a stable dep instead of the full settings object.
	const selectMultiple = useMemo(() => {
		if (!settings) return false;
		return (
			settings.minimumSelection !== undefined &&
			settings.maximumSelection !== undefined &&
			settings.minimumSelection <= settings.maximumSelection &&
			settings.maximumSelection > 1
		);
	}, [settings?.minimumSelection, settings?.maximumSelection]);

	const settingsDefined = settings !== undefined;
	const deselectOnEmpty = settings?.deselectOnEmpty ?? false;

	useEffect(() => {
		if (settings) {
			if (
				selectManagers[viewportId][componentId] &&
				selectManagers[viewportId][componentId].selectMultiple !==
					selectMultiple
			) {
				cleanUpSelectManager(
					viewportId,
					componentId,
					appliedAvailableEffectsRef.current,
					interactionEngine,
				);
			}

			if (
				!selectManagers[viewportId][componentId] &&
				interactionEngine &&
				interactionEngine.closed === false
			) {
				if (selectMultiple) {
					const selectManager = new MultiSelectManager(
						componentId,
						selectionEffect,
						settings.minimumSelection!,
						settings.maximumSelection!,
					);
					selectManager.deselectOnEmpty = deselectOnEmpty;

					const token =
						interactionEngine.addInteractionManager(selectManager);
					selectManagers[viewportId][componentId] = {
						selectManager,
						token,
						selectMultiple,
					};
					setSelectManager(selectManager);
				} else {
					const selectManager = new SelectManager(
						componentId,
						selectionEffect,
					);
					selectManager.deselectOnEmpty = deselectOnEmpty;

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
			if (selectManagers[viewportId][componentId]) {
				cleanUpSelectManager(
					viewportId,
					componentId,
					appliedAvailableEffectsRef.current,
					interactionEngine,
				);
				appliedAvailableEffectsRef.current.clear();
				prevAvailableManagerRef.current = undefined;
				prevAvailableEffectRef.current = undefined;
				setSelectManager(undefined);
			}
		};
	}, [
		interactionEngine,
		settingsDefined,
		selectMultiple,
		deselectOnEmpty,
		selectionEffect,
	]);

	return {
		selectManager,
		setAvailableNodes,
		removeAvailableEffectsForNodes,
	};
}

// #endregion Functions (1)
