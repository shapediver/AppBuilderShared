import {EventResponseMapping} from "@shapediver/viewer.features.transformation-tools";
import {
	addListener,
	EVENTTYPE_TRANSFORMATION_TOOLS,
	removeListener,
} from "@shapediver/viewer.session";
import {useEffect, useRef, useState} from "react";

// #region Functions (1)

/**
 * Hook allowing to create the rectangle transform events.
 * In this event handler, the transformed nodes are updated.
 *
 * @param selectedNodes The selected nodes.
 * @param componentId The ID of the component.
 * @param initialTransformedNodeNames The initial transformed node names (used to initialize the selection state).
 * 					Note that this initial state is not checked against the filter pattern.
 */
export function useRectangleTransformEvents(
	selectedNodeNames: string[],
	componentId: string,
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
				const rectangleTransformEvent =
					e as EventResponseMapping[EVENTTYPE_TRANSFORMATION_TOOLS.MATRIX_CHANGED];

				// We only want to listen to rectangle transform events, so we check the type of the event.
				if (rectangleTransformEvent.type !== "rectangleTransform")
					return;

				// We ignore the event if it's not based on the component ID.
				if (rectangleTransformEvent.id !== componentId) return;

				// Create a new array to avoid mutating the state directly
				const newTransformedNodeNames = [
					...transformedNodeNamesRef.current,
				];

				for (let i = 0; i < rectangleTransformEvent.nodes.length; i++) {
					const transformation =
						rectangleTransformEvent.transformations[i];
					const localTransformation =
						rectangleTransformEvent.localTransformations[i];

					// search for the node in the selected nodes
					selectedNodeNames.forEach((name) => {
						// determine if the node is already in the transformed nodes array
						// if not add it, otherwise update the transformation
						const index = newTransformedNodeNames.findIndex(
							(tn) => tn.name === name,
						);
						if (index !== -1) {
							newTransformedNodeNames[index].transformation =
								Array.from(transformation);
							newTransformedNodeNames[
								index
							].localTransformations =
								Array.from(localTransformation);
						} else {
							newTransformedNodeNames.push({
								name: name,
								transformation: Array.from(transformation),
								localTransformations:
									Array.from(localTransformation),
							});
						}
					});
				}

				// Set the new array
				setTransformedNodeNames(newTransformedNodeNames);
			},
		);

		/**
		 * Remove the event listeners when the component is unmounted.
		 */
		return () => {
			removeListener(token);
		};
	}, [selectedNodeNames]);

	return {
		transformedNodeNames,
		setTransformedNodeNames,
	};
}

// #endregion Functions (1)
