import {InteractionEventResponseMapping} from "@shapediver/viewer.features.interaction";
import {
	EventResponseMapping,
	RectangleTransform,
} from "@shapediver/viewer.features.transformation-tools";
import {
	addListener,
	EVENTTYPE_INTERACTION,
	EVENTTYPE_TRANSFORMATION_TOOLS,
	FLAG_TYPE,
	type ITreeNode,
	removeListener,
} from "@shapediver/viewer.session";
import {type IViewportApi} from "@shapediver/viewer.viewport";
import {type MutableRefObject, useCallback, useEffect, useRef} from "react";

type Candidate = {name: string; node: ITreeNode};
type RectangleTransformSettings = NonNullable<
	ConstructorParameters<typeof RectangleTransform>[2]
>;

/** The key of the selected nodes of a gizmo, see useRectangleTransform. */
export const selectedNodesKeyOf = (nodes: Candidate[]): string =>
	nodes.map((entry) => `${entry.node.id}:${entry.name}`).join("|");

/**
 * Hover preview and first press of an exclusive rectangle transform.
 *
 * Hovering a candidate shows a rectangle on it (one preview gizmo, moved
 * between the candidates). It is not a selection: it disappears when the
 * pointer leaves it, and a press on it (a handle, the rectangle, or the
 * object) selects the object and continues as a scaling, rotation, or
 * translation in the same press. The gizmo is handed over to the selection
 * (see takeAdopted).
 *
 * A press on a candidate without a preview (e.g. on touch) selects it on
 * pointerdown: the camera stays still until the pointer is released, and the
 * gizmo created for the selection continues the press as a translation (see
 * takePendingPress).
 *
 * @param enabled Whether the parameter is exclusive and active.
 * @param hidden Whether no preview is shown (e.g. during a computation).
 * @param createSettings The settings of a gizmo for the given nodes.
 */
export function useRectangleTransformPreview({
	enabled,
	hidden,
	viewportApi,
	componentId,
	selectionComponentId,
	candidateNodes,
	selectedNodeNames,
	setSelectedNodeNames,
	nodeNamesRef,
	createSettings,
}: {
	enabled: boolean;
	hidden: boolean;
	viewportApi?: IViewportApi;
	/** The id of the gizmo of the selection. */
	componentId: string;
	/** The id of the select and hover managers. */
	selectionComponentId: string;
	candidateNodes: Candidate[];
	selectedNodeNames: string[];
	setSelectedNodeNames: (names: string[]) => void;
	nodeNamesRef: MutableRefObject<Map<string, string>>;
	createSettings: (nodes: ITreeNode[]) => RectangleTransformSettings;
}): {
	/** The preview gizmo a press selected, if it was on these nodes. */
	takeAdopted: (selectedNodesKey: string) => RectangleTransform | undefined;
	/** The pointerdown which selected a candidate, while it is pressed. */
	takePendingPress: () => PointerEvent | undefined;
} {
	const previewId = `${componentId}-preview`;
	const previewRef = useRef<
		{rectangle: RectangleTransform; candidate: Candidate} | undefined
	>(undefined);
	const adoptedRef = useRef<
		{rectangle: RectangleTransform; key: string} | undefined
	>(undefined);
	const pendingPressRef = useRef<PointerEvent | undefined>(undefined);

	const candidatesRef = useRef(candidateNodes);
	candidatesRef.current = candidateNodes;
	const selectedRef = useRef(selectedNodeNames);
	selectedRef.current = selectedNodeNames;
	const hiddenRef = useRef(hidden);
	hiddenRef.current = hidden;
	const createSettingsRef = useRef(createSettings);
	createSettingsRef.current = createSettings;
	const setSelectedRef = useRef(setSelectedNodeNames);
	setSelectedRef.current = setSelectedNodeNames;

	useEffect(() => {
		if (!enabled || !viewportApi) return;

		const showPreview = (candidate: Candidate) => {
			const preview = previewRef.current;
			if (preview && !preview.rectangle.closed) {
				if (
					preview.candidate.node !== candidate.node ||
					!preview.rectangle.show
				)
					preview.rectangle.setNodes(
						[candidate.node],
						createSettingsRef.current([candidate.node])
							.restrictions ?? {},
					);
				preview.candidate = candidate;
				preview.rectangle.show = true;
				return;
			}
			previewRef.current = {
				rectangle: new RectangleTransform(
					viewportApi,
					[candidate.node],
					{
						...createSettingsRef.current([candidate.node]),
						preview: true,
						translateOnObjects: true,
					},
					previewId,
				),
				candidate,
			};
		};

		const hoverToken = addListener(EVENTTYPE_INTERACTION.HOVER_ON, (e) => {
			const event =
				e as InteractionEventResponseMapping[EVENTTYPE_INTERACTION.HOVER_ON];
			if (event.viewportId !== viewportApi.id) return;
			if (event.manager.id !== selectionComponentId) return;
			// no change during a drag (also of the camera)
			if (!event.event || event.event.buttons !== 0) return;
			if (hiddenRef.current) return;
			const node = event.nodes[event.nodes.length - 1];
			const candidate = candidatesRef.current.find(
				(c) => c.node === node,
			);
			if (!candidate || selectedRef.current.includes(candidate.name))
				return;
			if (candidate.node.boundingBox.isEmpty()) return;
			showPreview(candidate);
		});

		const hoverChangedToken = addListener(
			EVENTTYPE_TRANSFORMATION_TOOLS.HOVER_CHANGED,
			(e) => {
				const event =
					e as EventResponseMapping[EVENTTYPE_TRANSFORMATION_TOOLS.HOVER_CHANGED];
				const preview = previewRef.current;
				if (event.id !== previewId || !preview || event.hovered) return;
				preview.rectangle.show = false;
			},
		);

		const gestureToken = addListener(
			EVENTTYPE_TRANSFORMATION_TOOLS.GESTURE_START,
			(e) => {
				const event =
					e as EventResponseMapping[EVENTTYPE_TRANSFORMATION_TOOLS.GESTURE_START];
				const preview = previewRef.current;
				if (event.id !== previewId || !preview) return;
				previewRef.current = undefined;
				// the gesture continues on the gizmo of the selection
				preview.rectangle.promote(componentId);
				adoptedRef.current?.rectangle.close();
				adoptedRef.current = {
					rectangle: preview.rectangle,
					key: selectedNodesKeyOf([preview.candidate]),
				};
				nodeNamesRef.current = new Map([
					[preview.candidate.node.id, preview.candidate.name],
				]);
				setSelectedRef.current([preview.candidate.name]);
			},
		);

		// a press which selects a candidate keeps the camera still until the
		// pointer is released, the gizmo continues it as a translation
		let cameraFreezeToken: string | undefined;
		let pressedPointerId: number | undefined;
		const releasePress = (event: PointerEvent) => {
			if (pressedPointerId !== event.pointerId) return;
			pressedPointerId = undefined;
			pendingPressRef.current = undefined;
			if (cameraFreezeToken) viewportApi.removeFlag(cameraFreezeToken);
			cameraFreezeToken = undefined;
		};
		const selectToken = addListener(
			EVENTTYPE_INTERACTION.SELECT_ON,
			(e) => {
				const event =
					e as InteractionEventResponseMapping[EVENTTYPE_INTERACTION.SELECT_ON];
				if (event.manager.id !== selectionComponentId) return;
				if (event.event?.type !== "pointerdown") return;
				pendingPressRef.current = event.event;
				pressedPointerId = event.event.pointerId;
				if (!cameraFreezeToken)
					cameraFreezeToken = viewportApi.addFlag(
						FLAG_TYPE.CAMERA_FREEZE,
					);
			},
		);
		window.addEventListener("pointerup", releasePress, true);
		window.addEventListener("pointercancel", releasePress, true);

		return () => {
			removeListener(hoverToken);
			removeListener(hoverChangedToken);
			removeListener(gestureToken);
			removeListener(selectToken);
			window.removeEventListener("pointerup", releasePress, true);
			window.removeEventListener("pointercancel", releasePress, true);
			if (cameraFreezeToken) viewportApi.removeFlag(cameraFreezeToken);
			pendingPressRef.current = undefined;
			previewRef.current?.rectangle.close();
			previewRef.current = undefined;
			adoptedRef.current?.rectangle.close();
			adoptedRef.current = undefined;
		};
	}, [enabled, viewportApi, componentId, selectionComponentId, previewId]);

	// a computation hides the preview
	useEffect(() => {
		if (hidden && previewRef.current)
			previewRef.current.rectangle.show = false;
	}, [hidden]);

	// the preview of a selected object disappears
	useEffect(() => {
		const preview = previewRef.current;
		if (preview && selectedNodeNames.includes(preview.candidate.name))
			preview.rectangle.show = false;
	}, [selectedNodeNames]);

	const takeAdopted = useCallback((selectedNodesKey: string) => {
		const adopted = adoptedRef.current;
		adoptedRef.current = undefined;
		if (!adopted) return;
		if (adopted.key === selectedNodesKey && !adopted.rectangle.closed)
			return adopted.rectangle;
		adopted.rectangle.close();
		return undefined;
	}, []);

	const takePendingPress = useCallback(() => {
		const press = pendingPressRef.current;
		pendingPressRef.current = undefined;
		return press;
	}, []);

	return {takeAdopted, takePendingPress};
}
