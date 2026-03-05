import {useInteractionEngine} from "./useInteractionEngine";
import {parseInteractionEffect} from "@AppBuilderLib/shared/lib/interactionEffects";
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
import {useEffect, useRef, useState} from "react";

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
	availableNodeData?: {
		nodes: ITreeNode[] | undefined;
		tokens: string[] | undefined;
	},
	interactionEngine?: InteractionEngine,
) => {
	if (dragManagers[viewportId][componentId]) {
		if (
			availableNodeData &&
			availableNodeData.nodes &&
			availableNodeData.tokens
		) {
			availableNodeData.nodes.forEach((node, index) => {
				dragManagers[viewportId][
					componentId
				].dragManager!.interactionEffectUtils.removeInteractionEffect(
					node,
					availableNodeData.tokens![index],
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

	const availableNodeDataRef = useRef<{
		nodes: ITreeNode[] | undefined;
		tokens: string[] | undefined;
	}>({
		nodes: undefined,
		tokens: undefined,
	});

	useEffect(() => {
		const effect = parseInteractionEffect(settings?.draggingColor);

		effect.then((e) => {
			if (e) {
				if (e instanceof Promise) {
					e.then((e) => setDraggingEffect(e as MaterialStandardData));
				} else {
					setDraggingEffect(e as IInteractionEffect);
				}
			} else if (settings?.draggingColor !== null) {
				setDraggingEffect({
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
				});
			} else {
				setDraggingEffect(undefined);
			}
		});
	}, [settings?.draggingColor]);

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

	// whenever the passive nodes change, we need to update the select manager
	useEffect(() => {
		if (!availableEffect) return;
		let tokens: string[] = [];

		if (availableNodes && dragManager) {
			availableNodes.forEach((node) => {
				const token =
					dragManager.interactionEffectUtils.applyInteractionEffect(
						node,
						availableEffect,
					);
				tokens.push(token);
			});

			availableNodeDataRef.current = {
				nodes: availableNodes,
				tokens,
			};
		}

		return () => {
			if (availableNodes && dragManager) {
				availableNodes.forEach((node, index) => {
					dragManager.interactionEffectUtils.removeInteractionEffect(
						node,
						tokens[index],
					);
				});
			}
		};
	}, [availableEffect, availableNodes]);

	// use an effect to create the drag manager
	useEffect(() => {
		if (
			settings &&
			interactionEngine &&
			interactionEngine.closed === false &&
			!dragManagers[viewportId][componentId]
		) {
			// create the drag manager with the given settings
			const dragManager = new DragManager(componentId, draggingEffect);
			const token = interactionEngine.addInteractionManager(dragManager);
			dragManagers[viewportId][componentId] = {dragManager, token};
			setDragManager(dragManagers[viewportId][componentId].dragManager);
		}

		return () => {
			// clean up the drag manager
			if (dragManagers[viewportId][componentId]) {
				cleanUpDragManager(
					viewportId,
					componentId,
					availableNodeDataRef.current,
					interactionEngine,
				);
				setDragManager(undefined);
			}
		};
	}, [interactionEngine, settings, draggingEffect]);

	return {
		dragManager,
		setAvailableNodes,
	};
}

// #endregion Functions (1)
