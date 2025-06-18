import {useEffect} from "react";

import {useShapeDiverStoreAttributeVisualization} from "@AppBuilderShared/store/useShapeDiverStoreAttributeVisualization";
import {useShapeDiverStoreViewport} from "@AppBuilderShared/store/useShapeDiverStoreViewport";
import {AttributeVisualizationEngine} from "@shapediver/viewer.features.attribute-visualization";
import {MaterialStandardData} from "@shapediver/viewer.session";
import {useShallow} from "zustand/react/shallow";

/**
 * Hook allowing to create an attribute visualization engine for a viewport.
 *
 * @param viewportId
 */
export function useAttributeVisualizationEngine(viewportId: string): {
	/**
	 * The attribute visualization engine for the viewport.
	 */
	attributeVisualizationEngine: AttributeVisualizationEngine | undefined;
} {
	const {
		createAttributeVisualizationEngine,
		closeAttributeVisualizationEngine,
	} = useShapeDiverStoreAttributeVisualization(
		useShallow((state) => ({
			createAttributeVisualizationEngine:
				state.createAttributeVisualizationEngine,
			closeAttributeVisualizationEngine:
				state.closeAttributeVisualizationEngine,
		})),
	);

	// get the viewport API
	const viewportApi = useShapeDiverStoreViewport((state) => {
		return state.viewports[viewportId];
	});

	const {attributeVisualizationEngines} =
		useShapeDiverStoreAttributeVisualization(
			useShallow((state) => ({
				attributeVisualizationEngines:
					state.attributeVisualizationEngines,
			})),
		);

	// use an effect to create the attribute visualization engine
	useEffect(() => {
		if (viewportApi) {
			// create the attribute visualization engine
			const attributeVisualizationEngine =
				createAttributeVisualizationEngine(
					viewportApi,
				) as AttributeVisualizationEngine;
			if (!attributeVisualizationEngine) return;

			attributeVisualizationEngine.updateLayerMaterialType("standard");
			attributeVisualizationEngine.updateDefaultMaterial(
				new MaterialStandardData({color: "#666"}),
			);
			attributeVisualizationEngine.updateDefaultLayer({
				color: "#666",
				opacity: 1,
				enabled: true,
			});
			attributeVisualizationEngine.updateVisualizedMaterialType(
				"standard",
			);
		}

		return () => {
			// close the attribute visualization engine
			closeAttributeVisualizationEngine(viewportId);
		};
	}, [viewportApi]);

	return {
		attributeVisualizationEngine: attributeVisualizationEngines[
			viewportId
		] as AttributeVisualizationEngine | undefined,
	};
}
