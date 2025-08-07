import {IAttributeDefinition} from "@AppBuilderShared/components/shapediver/appbuilder/widgets/AppBuilderAttributeVisualizationWidgetComponent";
import {useSelection} from "@AppBuilderShared/hooks/shapediver/viewer/interaction/selection/useSelection";
import {useShapeDiverStoreInteractionRequestManagement} from "@AppBuilderShared/store/useShapeDiverStoreInteractionRequestManagement";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {getNodesByName} from "@shapediver/viewer.features.interaction";
import {
	ISDTFAttributeData,
	ITreeNode,
	SDTFItemData,
	SessionApiData,
} from "@shapediver/viewer.session";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";

export type AttributeSelectionData = {
	selectedItemData: {
		[key: string]: ISDTFAttributeData;
	};
	location: [number, number, number];
};

/**
 * Component to be able to select objects with attribute data in the viewer.
 *
 * @param props
 * @returns
 */
export default function useAttributeSelection(
	viewportId: string,
	active: boolean,
	renderedAttribute?: IAttributeDefinition,
): AttributeSelectionData | undefined {
	const sessions = useShapeDiverStoreSession((state) => state.sessions);

	const [nameFilter, setNameFilter] = useState<{[key: string]: string[]}>({});
	const [attributeSelectionData, setAttributeSelectionData] = useState<
		AttributeSelectionData | undefined
	>();
	const [allowed, setAllowed] = useState<boolean>(true);
	// reference to manage the interaction request token
	const interactionRequestTokenRef = useRef<string | undefined>(undefined);

	const {addSessionUpdateCallback} = useShapeDiverStoreSession();

	// get the interaction request management
	const {addInteractionRequest, removeInteractionRequest} =
		useShapeDiverStoreInteractionRequestManagement();

	/**
	 * Effect to manage the interaction request for the selection.
	 * It adds an interaction request when the selection is active and removes it when the selection is inactive.
	 * It also cleans up the interaction request when the component is unmounted or when the selection state changes.
	 */
	useEffect(() => {
		if (active && !interactionRequestTokenRef.current) {
			const returnedToken = addInteractionRequest({
				type: "passive",
				viewportId,
				disable: () => {
					setAllowed(false);
				},
				enable: () => {
					setAllowed(true);
				},
			});
			interactionRequestTokenRef.current = returnedToken;
		} else if (!active && interactionRequestTokenRef.current) {
			removeInteractionRequest(interactionRequestTokenRef.current);
			interactionRequestTokenRef.current = undefined;
		}

		return () => {
			if (interactionRequestTokenRef.current) {
				removeInteractionRequest(interactionRequestTokenRef.current);
				interactionRequestTokenRef.current = undefined;
			}
		};
	}, [active]);

	/**
	 * Whenever the session is updated, the name filter is updated as well.
	 * We search for all nodes that have an SDTFItemData and add the name of the node to the name filter.
	 */
	const sessionCallback = useCallback(
		(newNode?: ITreeNode) => {
			if (!newNode) return;

			const sessionApi = (
				newNode.data.find(
					(data) => data instanceof SessionApiData,
				) as SessionApiData
			).api;
			if (!sessionApi) return;

			const nameFilterPerSession: string[] = [];
			newNode.traverse((node) => {
				if (!renderedAttribute) return;
				for (const data of node.data) {
					if (data instanceof SDTFItemData) {
						// separate criteria if the current selected attribute is present in the item data
						// if the item data is not present, we can skip this node
						if (
							Object.entries(data.attributes).some(
								([key, value]) =>
									renderedAttribute.key === key &&
									renderedAttribute.type === value.typeHint,
							)
						) {
							// get the name of the node and add it to the name filter
							const path = node.getPath().split(".");
							// remove the first two elements of the path, because they are the root and session name
							// we might get here before the session is even added to the root, so we check for that
							if (path[0] === "root") path.shift();
							path.shift();
							// replace the first element of the path with the output name
							const outputApi = sessionApi.outputs[path[0]];
							if (!outputApi) continue;
							path[0] = outputApi.name;
							nameFilterPerSession.push(path.join("."));
						}
					}
				}
			});

			setNameFilter((prev) => {
				const newFilter = {...prev};
				newFilter[sessionApi.id] = nameFilterPerSession;

				return newFilter;
			});
		},
		[sessions, renderedAttribute],
	);

	/**
	 * Use effect to add / remove the session update callbacks.
	 */
	useEffect(() => {
		const removeSessionUpdateCallbacks = Object.keys(sessions).map(
			(sessionId) => addSessionUpdateCallback(sessionId, sessionCallback),
		);

		return () => {
			removeSessionUpdateCallbacks.forEach(
				(removeSessionUpdateCallback) => {
					removeSessionUpdateCallback();
				},
			);
		};
	}, [sessions, sessionCallback]);

	/**
	 * Create the selection properties for the selection hook with the new name filter.
	 */
	const selectionProps = useMemo(() => {
		return {
			maximumSelection: 1,
			minimumSelection: 1,
			nameFilter: Object.values(nameFilter).flat(),
			selectionColor: "#0d44f0",
			hover: true,
			hoverColor: "#00ff78",
		};
	}, [nameFilter]);

	const {selectedNodeNames} = useSelection(
		viewportId,
		selectionProps,
		active && allowed,
		undefined,
		false,
	);

	/**
	 * Whenever the selected nodes change, we check if the node has an SDTFItemData.
	 * If it does, we set the attribute selection data to the attributes of the SDTFItemData.
	 */
	useEffect(() => {
		if (selectedNodeNames.length > 0) {
			const nodes = getNodesByName(
				Object.values(sessions),
				selectedNodeNames,
				false,
			);
			if (nodes.length > 0) {
				const node = nodes[0].node;
				const sdtfItemData = node.data.find(
					(data) => data instanceof SDTFItemData,
				);
				if (sdtfItemData) {
					setAttributeSelectionData({
						selectedItemData: sdtfItemData.attributes,
						location: [
							node.boundingBox.boundingSphere.center[0],
							node.boundingBox.boundingSphere.center[1],
							node.boundingBox.boundingSphere.center[2],
						],
					});
					return;
				}
			}
		}

		setAttributeSelectionData(undefined);
	}, [selectedNodeNames]);

	return attributeSelectionData;
}
