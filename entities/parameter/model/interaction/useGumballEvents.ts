import {mergeTransformationEvent} from "@AppBuilderLib/entities/parameter/lib/transformedNodes";
import {EventResponseMapping} from "@shapediver/viewer.features.transformation-tools";
import {
	addListener,
	EVENTTYPE_TRANSFORMATION_TOOLS,
	removeListener,
} from "@shapediver/viewer.session";
import {type MutableRefObject, useEffect, useRef, useState} from "react";

// #region Functions (1)

/**
 * Hook allowing to create the gumball events.
 * In this event handler, the transformed nodes are updated.
 *
 * @param selectedNodes The selected nodes.
 * @param componentId The ID of the component.
 * @param nodeNamesRef Scene node ids of the gumball, mapped to their interaction names.
 * @param initialTransformedNodeNames The initial transformed node names (used to initialize the selection state).
 * 					Note that this initial state is not checked against the filter pattern.
 */
export function useGumballEvents(
	selectedNodeNames: string[],
	componentId: string,
	nodeNamesRef: MutableRefObject<Map<string, string>>,
	initialTransformedNodeNames?: {name: string; transformation: number[]}[],
): {
	/**
	 * The transformed nodes.
	 */
	transformedNodeNames: {
		name: string;
		transformation: number[];
		localTransformations?: number[];
	}[];
	/**
	 * Set the transformed nodes.
	 *
	 * @param nodes
	 * @returns
	 */
	setTransformedNodeNames: (
		nodes: {
			name: string;
			transformation: number[];
			localTransformations?: number[];
		}[],
	) => void;
} {
	// state for the transformed node names
	const [transformedNodeNames, setTransformedNodeNames] = useState<
		{
			name: string;
			transformation: number[];
			localTransformations?: number[];
		}[]
	>(initialTransformedNodeNames ?? []);
	// create a reference to the transformed node names
	const transformedNodeNamesRef = useRef(transformedNodeNames);

	// update the reference when the state changes
	useEffect(() => {
		transformedNodeNamesRef.current = transformedNodeNames;
	}, [transformedNodeNames]);

	// register an event handler and listen for output updates
	useEffect(() => {
		const token = addListener(
			EVENTTYPE_TRANSFORMATION_TOOLS.MATRIX_CHANGED,
			(e) => {
				const gumballEvent =
					e as EventResponseMapping[EVENTTYPE_TRANSFORMATION_TOOLS.MATRIX_CHANGED];

				// We only want to listen to gumball events, so we check the type of the event.
				if (gumballEvent.type !== "gumball") return;

				// We ignore the event if it's not based on the component ID.
				if (gumballEvent.id !== componentId) return;

				setTransformedNodeNames(
					mergeTransformationEvent(
						transformedNodeNamesRef.current,
						gumballEvent,
						nodeNamesRef.current,
						selectedNodeNames,
					),
				);
			},
		);

		/**
		 * Remove the event listeners when the component is unmounted.
		 */
		return () => {
			removeListener(token);
		};
	}, [selectedNodeNames, componentId, nodeNamesRef]);

	return {
		transformedNodeNames,
		setTransformedNodeNames,
	};
}

// #endregion Functions (1)
