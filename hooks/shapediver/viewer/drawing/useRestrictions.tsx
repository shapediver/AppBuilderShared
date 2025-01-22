import { IDrawingParameterSettings, ITreeNode } from "@shapediver/viewer.session";
import { CameraPlaneRestrictionProperties, GeometryRestrictionProperties, LineRestrictionProperties, PlaneRestrictionProperties, PointRestrictionProperties, Settings } from "@shapediver/viewer.features.drawing-tools";
import React, { useEffect, useState } from "react";
import { ICreateNameFilterPatternState, CreateNameFilterPatternHandler } from "@AppBuilderShared/hooks/shapediver/viewer/interaction/useCreateNameFilterPattern";
import { IFindNodesByPatternState, FindNodesByPatternHandler } from "@AppBuilderShared/hooks/shapediver/viewer/interaction/useFindNodesByPattern";

// #region Functions (1)

/**
 * Hook for using the restrictions.
 * 
 * @param restrictionProps The restriction properties.
 * 
 * @returns The restriction settings.
 */
export function useRestrictions(
	restrictionProps: IDrawingParameterSettings["restrictions"]
): {
	/**
	 * The restriction settings.
	 */
	restrictions: Settings["restrictions"]
	/**
	 * The handlers to be added to the document.
	 */
	handlers: JSX.Element[]
} {
	// state for available node names
	const [nodes, setNodes] = useState<{ [key: string]: { [key: string]: { [key: string]: ITreeNode[] } } }>({});
	// state for the find nodes by pattern state map
	const [findNodesByPatternStateMap, setFindNodesByPatternStateMap] = useState<{ [key: string]: { [key: string]: { [key: string]: IFindNodesByPatternState } } }>({});
	// state for the create name filter pattern state map
	const [createNameFilterPatternStateMap, setCreateNameFilterPatternStateMap] = useState<{ [key: string]: ICreateNameFilterPatternState }>({});
	// state for the find nodes by pattern handlers
	const [findNodesByPatternHandlers, setFindNodesByPatternHandlers] = useState<JSX.Element[]>([]);
	// state for the create name filter pattern handlers
	const [createNameFilterPatternHandlers, setCreateNameFilterPatternHandlers] = useState<JSX.Element[]>([]);
	// restriction settings state
	const [restrictions, setRestrictions] = useState<Settings["restrictions"]>({});

	useEffect(() => {
		const createNameFilterPatternHandlers: JSX.Element[] = [];
		if (restrictionProps) {
			restrictionProps.forEach((restrictionDefinition, index) => {
				if(restrictionDefinition.type !== "geometry") return;
				createNameFilterPatternHandlers.push(
					<CreateNameFilterPatternHandler
						key={`CreateNameFilterPatternHandler_${restrictionDefinition.id || `restriction_${index}`}`}
						nameFilter={restrictionDefinition.nameFilter}
						setData={(data) => {
							setCreateNameFilterPatternStateMap(prev => ({
								...prev,
								[restrictionDefinition.id || `restriction_${index}`]: data as ICreateNameFilterPatternState
							}));
						}}
					/>
				);
			});
		}

		setCreateNameFilterPatternHandlers(createNameFilterPatternHandlers);
	}, [restrictionProps]);


	useEffect(() => {
		const findNodesByPatternHandlers: JSX.Element[] = [];
		Object.entries(createNameFilterPatternStateMap).forEach(([restrictionId, patterns]) => {
			Object.entries(patterns.patterns).forEach(([sessionId, pattern]) => {
				Object.entries(pattern).forEach(([outputId, pattern]) => {
					if (!findNodesByPatternStateMap[sessionId]?.[outputId]) {
						setFindNodesByPatternStateMap({
							...findNodesByPatternStateMap,
							[restrictionId]: {
								...(findNodesByPatternStateMap[restrictionId] || {}),
								[sessionId]: {
									...(findNodesByPatternStateMap[restrictionId]?.[sessionId] || {}),
									[outputId]: {
										nodes: []
									}
								}
							}
						});
					}

					findNodesByPatternHandlers.push(
						<FindNodesByPatternHandler
							key={`FindNodesByPatternHandler_${restrictionId}_${sessionId}_${outputId}`}
							sessionId={sessionId}
							outputIdOrName={outputId}
							patterns={pattern}
							setData={(data) => {
								setFindNodesByPatternStateMap(prev => ({
									...prev,
									[restrictionId]: {
										...(prev[restrictionId] || {}),
										[sessionId]: {
											...(prev[restrictionId]?.[sessionId] || {}),
											[outputId]: data as IFindNodesByPatternState
										}
									}
								}));
							}}
						/>
					);
				});
			});
		});

		setFindNodesByPatternHandlers(findNodesByPatternHandlers);
	}, [createNameFilterPatternStateMap]);

	useEffect(() => {
		const gatheredNodes: { [key: string]: { [key: string]: { [key: string]: ITreeNode[] } } } = {};
		Object.entries(findNodesByPatternStateMap).forEach(([restrictionId, dataPerRestriction]) => {
			Object.entries(dataPerRestriction).forEach(([sessionId, dataPerSession]) => {
				Object.entries(dataPerSession).forEach(([outputId, dataPerOutput]) => {
					if (!gatheredNodes[restrictionId]) gatheredNodes[restrictionId] = {};
					if (!gatheredNodes[restrictionId][sessionId]) gatheredNodes[restrictionId][sessionId] = {};
					gatheredNodes[restrictionId][sessionId][outputId] = dataPerOutput.nodes;
				});
			});
		});

		setNodes(gatheredNodes);
	}, [findNodesByPatternStateMap]);

	/**
	 * Create the restriction settings.
	 * 
	 * Depending on the restriction type, the restriction settings are created.
	 * For a plane restriction, the restriction properties are copied.
	 * For a geometry restriction, all available nodes are used.
	 * @todo For now, only one geometry restriction is supported.
	 */
	useEffect(() => {
		const restrictions: Settings["restrictions"] = {};
		if (restrictionProps && restrictionProps.length > 0) {
			for (let i = 0; i < restrictionProps.length; i++) {
				const r = restrictionProps![i];
				const restrictionName = r.id || `restriction_${i}`;
				const nodesPerRestriction = nodes[restrictionName];

				if (r.type === "geometry" && nodesPerRestriction && Object.keys(nodesPerRestriction).length !== 0) {
					const nodesArray: ITreeNode[] = [];
					for (const sessionId in nodesPerRestriction) {
						for (const outputId in nodesPerRestriction[sessionId]) {
							nodesArray.push(...nodesPerRestriction[sessionId][outputId]);
						}
					}

					restrictions[restrictionName] = {
						...r,
						nodes: nodesArray
					} as GeometryRestrictionProperties;
					continue;
				} else if (r.type !== "geometry") {
					restrictions[restrictionName] = r as PlaneRestrictionProperties | CameraPlaneRestrictionProperties | LineRestrictionProperties | PointRestrictionProperties;
				}
			}
		}

		setRestrictions(restrictions);
	}, [restrictionProps, nodes]);

	return {
		handlers: findNodesByPatternHandlers.concat(createNameFilterPatternHandlers),
		restrictions
	};
}

// #endregion Functions (1)
