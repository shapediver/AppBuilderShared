import {
	IUseCreateNameFilterPatternProps,
	useCreateNameFilterPatterns,
} from "@AppBuilderShared/hooks/shapediver/viewer/interaction/useCreateNameFilterPattern";
import {
	IUseFindNodesByPatternProps,
	useFindNodesByPatterns,
} from "@AppBuilderShared/hooks/shapediver/viewer/interaction/useFindNodesByPattern";
import {
	CameraPlaneRestrictionProperties,
	GeometryRestrictionProperties,
	LineRestrictionProperties,
	PlaneRestrictionProperties,
	PointRestrictionProperties,
	Settings,
} from "@shapediver/viewer.features.drawing-tools";
import {IDrawingParameterSettings, ITreeNode} from "@shapediver/viewer.session";
import {useEffect, useMemo, useState} from "react";

// #region Functions (1)

/**
 * Hook for using the restrictions.
 *
 * @param restrictionProps The restriction properties.
 *
 * @returns The restriction settings.
 */
export function useRestrictions(
	restrictionProps: IDrawingParameterSettings["restrictions"],
): {
	/**
	 * The restriction settings.
	 */
	restrictions: Settings["restrictions"];
} {
	// state for available node names
	const [nodes, setNodes] = useState<{
		[key: string]: {[key: string]: {[key: string]: ITreeNode[]}};
	}>({});

	// restriction settings state
	const [restrictions, setRestrictions] = useState<Settings["restrictions"]>(
		{},
	);

	// create the filter patterns for the geometry restrictions
	const restrictionNameFilter = useMemo(() => {
		const nameFilter: {
			[key: string]: IUseCreateNameFilterPatternProps;
		} = {};
		if (restrictionProps) {
			restrictionProps.forEach((restrictionDefinition, index) => {
				if (restrictionDefinition.type !== "geometry") return;
				nameFilter[restrictionDefinition.id || `restriction_${index}`] =
					{
						nameFilter: restrictionDefinition.nameFilter || [],
					};
			});
		}
		return nameFilter;
	}, [restrictionProps]);

	// create the patterns for the geometry restrictions based on the filter patterns
	const {patterns} = useCreateNameFilterPatterns(restrictionNameFilter);

	// create a map of the patterns by the restriction ID, session ID, and output ID
	const patternsByKeys: {[key: string]: IUseFindNodesByPatternProps} =
		useMemo(() => {
			const patternsByKeys: {[key: string]: IUseFindNodesByPatternProps} =
				{};
			Object.entries(patterns).forEach(([restrictionId, patterns]) => {
				if (!patterns.outputPatterns) return;
				Object.entries(patterns.outputPatterns).forEach(
					([sessionId, pattern]) => {
						Object.entries(pattern).forEach(
							([outputId, pattern]) => {
								patternsByKeys[
									`${restrictionId}_${sessionId}_${outputId}`
								] = {
									sessionId,
									outputId: outputId,
									patterns: pattern,
								};
							},
						);
					},
				);
			});

			return patternsByKeys;
		}, [patterns]);

	// get the nodes based on the patterns
	const {nodes: nodesByPatterns} = useFindNodesByPatterns(patternsByKeys);

	// gather the nodes by the restriction ID, session ID, and output ID
	// and set the nodes state
	useEffect(() => {
		const gatheredNodes: {
			[key: string]: {[key: string]: {[key: string]: ITreeNode[]}};
		} = {};
		Object.entries(nodesByPatterns).forEach(([key, data]) => {
			const [restrictionId, sessionId, outputId] = key.split("_");
			if (!gatheredNodes[restrictionId])
				gatheredNodes[restrictionId] = {};
			if (!gatheredNodes[restrictionId][sessionId])
				gatheredNodes[restrictionId][sessionId] = {};
			gatheredNodes[restrictionId][sessionId][outputId] = data;
		});
		setNodes(gatheredNodes);
	}, [nodesByPatterns]);

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

				if (
					r.type === "geometry" &&
					nodesPerRestriction &&
					Object.keys(nodesPerRestriction).length !== 0
				) {
					const nodesArray: ITreeNode[] = [];
					for (const sessionId in nodesPerRestriction) {
						for (const outputId in nodesPerRestriction[sessionId]) {
							nodesArray.push(
								...nodesPerRestriction[sessionId][outputId],
							);
						}
					}

					restrictions[restrictionName] = {
						...r,
						nodes: nodesArray,
					} as GeometryRestrictionProperties;
					continue;
				} else if (r.type !== "geometry") {
					restrictions[restrictionName] = r as
						| PlaneRestrictionProperties
						| CameraPlaneRestrictionProperties
						| LineRestrictionProperties
						| PointRestrictionProperties;
				}
			}
		}

		setRestrictions(restrictions);
	}, [restrictionProps, nodes]);

	return {
		restrictions,
	};
}

// #endregion Functions (1)
