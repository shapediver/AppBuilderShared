import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {ITreeNode} from "@shapediver/viewer.session";
import {MutableRefObject} from "react";
import type {ConvertedDragObject} from "./useConvertDraggingData";
import type {IUseNodeInteractionDataProps} from "./useNodeInteractionData";

/**
 * Create the input of useNodesInteractionData for the dragging objects.
 *
 * Output entries get one key per object, session and output.
 * Instance entries are keyed by the instance ID, because
 * useNodesInteractionData resolves an instance by its key.
 * Objects that target the same instance share that entry: their patterns
 * are merged, and the drag origin and anchors of the first one apply.
 */
export function createDraggingNodesInteractionInput(
	objects: ConvertedDragObject[],
	componentId: string,
	hover: boolean | undefined,
	removeAvailableEffectsRef: MutableRefObject<
		((nodes: ITreeNode[]) => void) | undefined
	>,
	strictNaming: boolean,
): {[key: string]: IUseNodeInteractionDataProps} {
	const input: {[key: string]: IUseNodeInteractionDataProps} = {};

	objects.forEach((object, index) => {
		const interactionSettings = {
			select: false,
			hover,
			drag: true,
			dragOrigin: object.dragOrigin,
			dragAnchors: object.dragAnchors,
		};
		const {outputPatterns, instancePatterns} = object.patterns;

		Object.entries(outputPatterns ?? {}).forEach(([sessionId, pattern]) => {
			Object.entries(pattern).forEach(([outputId, patterns]) => {
				input[`object${index}_${sessionId}_${outputId}`] = {
					sessionId,
					componentId,
					outputId,
					patterns,
					interactionSettings,
					removeAvailableEffectsRef,
					strictNaming,
				};
			});
		});

		Object.entries(instancePatterns ?? {}).forEach(
			([instanceId, patterns]) => {
				const existing = input[instanceId];
				if (!existing) {
					input[instanceId] = {
						componentId,
						patterns: [...patterns],
						interactionSettings,
						strictNaming,
					};
					return;
				}
				existing.patterns = [...existing.patterns, ...patterns];
				if (
					object.dragOrigin ||
					object.dragAnchors ||
					existing.interactionSettings.dragOrigin ||
					existing.interactionSettings.dragAnchors
				)
					Logger.warn(
						`Dragging objects on instance "${instanceId}" share one drag origin and anchors; those of the first object apply.`,
					);
			},
		);
	});

	return input;
}
