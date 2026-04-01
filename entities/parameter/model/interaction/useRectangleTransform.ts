import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";
import {useShapeDiverStoreViewport} from "@AppBuilderLib/entities/viewport/model/useShapeDiverStoreViewport";
import {
	getNodesByName,
	matchNodesWithPatterns,
	OutputNodeNameFilterPatterns,
	RESTRICTION_TYPE,
	RestrictionProperties,
} from "@shapediver/viewer.features.interaction";
import {
	RectangleTransform,
	updateTransformation,
} from "@shapediver/viewer.features.transformation-tools";
import {
	IRectangleTransformParameterProps,
	ISelectionParameterProps,
} from "@shapediver/viewer.session";
import {mat4, vec3} from "gl-matrix";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useRestrictions} from "../drawing/useRestrictions";
import {useConvertDraggingData} from "./useConvertDraggingData";
import {useRectangleTransformEvents} from "./useRectangleTransformEvents";
import {useSelection} from "./useSelection";

// #region Functions (1)

export interface IRectangleTransformState {
	/**
	 * The transformed node names.
	 */
	transformedNodeNames: {
		name: string;
		transformation: number[];
		localTransformations?: number[];
	}[];
	/**
	 * Set the transformed node names.
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
	/**
	 * The selected node names.
	 */
	selectedNodeNames: string[];
	/**
	 * Set the selected node names.
	 *
	 * @param selectedNodes
	 * @returns
	 */
	setSelectedNodeNames: (selectedNodes: string[]) => void;
	/**
	 * Restore the transformed node names.
	 *
	 * @param newTransformedNodeNames
	 * @param oldTransformedNodeNames
	 * @returns
	 */
	restoreTransformedNodeNames: (
		newTransformedNodeNames: {
			name: string;
			transformation: number[];
			localTransformations?: number[];
		}[],
		oldTransformedNodeNames: {name: string}[],
	) => void;
}

/**
 * Hook providing stateful rectangle transform interaction for a viewport and session.
 * This wraps lower level hooks for the selection and rectangle transform events.
 *
 * @param sessionIds IDs of the sessions which depend on the rectangle transform parameter.
 * @param viewportId ID of the viewport for which the rectangle transform shall be created.
 * @param rectangleTransformProps Parameter properties to be used. This includes name filters, and properties for the behavior of the rectangle transform.
 * @param activate Set this to true to activate the rectangle transform. If false, preparations are made but no rectangle transform is possible.
 * @param initialTransformedNodeNames The initial transformed node names (used to initialize the selection state).
 * 					Note that this initial state is not checked against the filter pattern.
 */
export function useRectangleTransform(
	sessionIds: string[],
	viewportId: string,
	rectangleTransformProps: IRectangleTransformParameterProps,
	activate: boolean,
	initialTransformedNodeNames?: {name: string; transformation: number[]}[],
	strictNaming = true,
): IRectangleTransformState {
	// get the session API
	const sessionApis = useShapeDiverStoreSession((state) => state.sessions);
	// get the viewport API
	const viewportApi = useShapeDiverStoreViewport((state) => {
		return state.viewports[viewportId];
	});

	// create the selection settings from the interaction settings
	const selectionSettings = useMemo(() => {
		if (!rectangleTransformProps) return {};

		const nameFilter: string[] = [];
		nameFilter.push(...(rectangleTransformProps.nameFilter ?? []));
		rectangleTransformProps.objects?.forEach((element) => {
			nameFilter.push(element.nameFilter);
		});

		return {
			nameFilter,
			hover: rectangleTransformProps.hover,
			minimumSelection: rectangleTransformProps.minimumSelection ?? 0,
			maximumSelection: rectangleTransformProps.maximumSelection ?? 1,
			deselectOnEmpty: rectangleTransformProps.deselectOnEmpty ?? false,
		} as ISelectionParameterProps;
	}, [rectangleTransformProps]);

	// track whether the maximum number of selections has been reached
	const [maxReached, setMaxReached] = useState(false);

	// use the selection hook to get the selected node names
	const {
		selectedNodeNames,
		setSelectedNodeNames,
		availableNodeNames,
		setSelectedNodeNamesAndRestoreSelection,
	} = useSelection(viewportId, selectionSettings, activate && !maxReached);

	// disable selection once the maximum number of objects has been reached
	useEffect(() => {
		const max = selectionSettings.maximumSelection;
		if (max === undefined || max === Infinity) return;
		setMaxReached(selectedNodeNames.length >= max);
	}, [selectedNodeNames.length, selectionSettings.maximumSelection]);

	// convert the dragging data
	const {objects} = useConvertDraggingData(
		sessionIds,
		rectangleTransformProps,
	);

	// use the rectangle transform events hook to get the transformed node names
	const {transformedNodeNames, setTransformedNodeNames} =
		useRectangleTransformEvents(
			selectedNodeNames,
			initialTransformedNodeNames,
		);

	// use an effect to set the selected node names to the first available node name if only one is available
	useEffect(() => {
		const singleAvailableNodeName =
			getSingleAvailableNodeName(availableNodeNames);
		if (activate && singleAvailableNodeName) {
			setSelectedNodeNamesAndRestoreSelection([singleAvailableNodeName]);
		}
	}, [availableNodeNames, setSelectedNodeNamesAndRestoreSelection]);

	// create a reference for the rectangle transform
	const rectangleTransformRef = useRef<RectangleTransform | undefined>(
		undefined,
	);

	// use the restrictions
	const {restrictions} = useRestrictions(
		rectangleTransformProps.restrictions,
	);

	// use an effect to create the rectangle transform whenever the selected node names change
	useEffect(() => {
		if (viewportApi && sessionApis && selectedNodeNames.length > 0) {
			// whenever the selected node names change, create a new rectangle transform
			const nodes = getNodesByName(
				Object.values(sessionApis),
				selectedNodeNames,
			);

			// for the nodes, we search for the correct restrictions in the dragging objects
			// this allows us to have different restrictions for different nodes
			// if no restrictions are found, we use an empty object
			// NOTE: We only do this if there is only one node selected
			// if multiple nodes are selected, we use no restrictions
			let restrictionsToUse: {[key: string]: RestrictionProperties} = {};
			if (nodes.length === 1 && restrictions) {
				const node = nodes[0];

				const processPatterns = (
					pattern: OutputNodeNameFilterPatterns,
					index: number,
				) => {
					// check if there are any patterns that match the selected nodes
					const matchedNodeNames = matchNodesWithPatterns(
						pattern,
						[node.node],
						strictNaming,
					);

					if (matchedNodeNames.length > 0) {
						if (
							objects[index].restrictions &&
							objects[index].restrictions.length > 0
						) {
							objects[index].restrictions.forEach(
								(restrictionId) => {
									const restriction =
										restrictions[restrictionId];
									if (!restriction) return;
									restrictionsToUse[restrictionId] =
										restriction;
								},
							);
						}
					}
				};

				for (let i = 0; i < objects.length; i++) {
					if (objects[i].patterns.outputPatterns) {
						Object.values(
							objects[i].patterns.outputPatterns!,
						).forEach((pattern) => {
							processPatterns(pattern, i);
						});
					}

					if (objects[i].patterns.instancePatterns) {
						const patterns = objects[i].patterns.instancePatterns!;
						if (!patterns) continue;
						processPatterns(patterns, i);
					}
				}
			}

			const props = {
				...rectangleTransformProps,
				plane: {
					type: RESTRICTION_TYPE.PLANE,
					origin: rectangleTransformProps?.plane?.origin
						? vec3.fromValues(
								rectangleTransformProps.plane.origin[0],
								rectangleTransformProps.plane.origin[1],
								rectangleTransformProps.plane.origin[2],
							)
						: vec3.fromValues(0, 0, 0),
					vector_u: rectangleTransformProps?.plane?.vector_u
						? vec3.fromValues(
								rectangleTransformProps.plane.vector_u[0],
								rectangleTransformProps.plane.vector_u[1],
								rectangleTransformProps.plane.vector_u[2],
							)
						: vec3.fromValues(1, 0, 0),
					vector_v: rectangleTransformProps?.plane?.vector_v
						? vec3.fromValues(
								rectangleTransformProps.plane.vector_v[0],
								rectangleTransformProps.plane.vector_v[1],
								rectangleTransformProps.plane.vector_v[2],
							)
						: vec3.fromValues(0, 1, 0),
				},
				restrictions:
					Object.values(restrictionsToUse).length === 0
						? undefined
						: restrictionsToUse,
			};

			console.log("Creating rectangle transform with props: ", nodes);
			const rectangle = new RectangleTransform(
				viewportApi,
				Object.values(nodes).map((n) => n.node),
				props,
			);
			rectangleTransformRef.current = rectangle;
		}

		return () => {
			// clean up the rectangle transform
			if (rectangleTransformRef.current) {
				rectangleTransformRef.current.close();
				rectangleTransformRef.current = undefined;
			}
		};
	}, [viewportApi, sessionApis, selectedNodeNames, objects, restrictions]);

	/**
	 * Restore the transformed node names.
	 *
	 * This function is used to restore the transformed nodes to their new transformation state.
	 * This means that the transformation of the nodes is updated to the new transformation state.
	 *
	 * @param newTransformedNodeNames The new transformed node names.
	 * @param oldTransformedNodeNames The old transformed node names.
	 * @returns
	 */
	const restoreTransformedNodeNames = useCallback(
		(
			newTransformedNodeNames: {
				name: string;
				transformation: number[];
				localTransformations?: number[];
			}[],
			oldTransformedNodeNames: {name: string}[],
		) => {
			const nodes = getNodesByName(
				Object.values(sessionApis),
				oldTransformedNodeNames.map((tn) => tn.name),
			);

			nodes.forEach((tn) => {
				// get the new transformation matrix (if it exists)
				const newTransformation = newTransformedNodeNames.find(
					(nt) => nt.name === tn.name,
				);

				// if there is a local transformation present that we can reset to, use it
				let transformationMatrix: mat4 | undefined;
				if (newTransformation && newTransformation.localTransformations)
					transformationMatrix = mat4.fromValues(
						...(newTransformation.localTransformations as [
							number,
							number,
							number,
							number,
							number,
							number,
							number,
							number,
							number,
							number,
							number,
							number,
							number,
							number,
							number,
							number,
						]),
					);

				// update the rectangle transform transformation
				// in case the transformation matrix is undefined, the transformation will be reset
				updateTransformation(tn.node, transformationMatrix);
			});

			setTransformedNodeNames(newTransformedNodeNames);
		},
		[sessionApis],
	);

	return {
		transformedNodeNames,
		setTransformedNodeNames,
		selectedNodeNames,
		setSelectedNodeNames,
		restoreTransformedNodeNames,
	};
}

/**
 * Get a single available node name, if there is only one available.
 *
 * @param availableNodeNames
 * @returns
 */
const getSingleAvailableNodeName = (availableNodeNames: {
	[key: string]: {[key: string]: string[]};
}): string | undefined => {
	let availableNodeName: string | undefined = undefined;
	let count = 0;

	for (const outerObj of Object.values(availableNodeNames)) {
		for (const arr of Object.values(outerObj)) {
			count += arr.length;
			if (count > 1) return;
			if (arr.length === 1) availableNodeName = arr[0];
		}
	}

	return availableNodeName;
};

// #endregion Functions (1)
