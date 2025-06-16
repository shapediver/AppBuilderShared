import {
	IDefaultAttributeCustomData,
	INumberAttributeCustomData,
	IShapeDiverStoreAttributeVisualization,
} from "@AppBuilderShared/types/store/shapediverStoreAttributeVisualization";
import {AttributeVisualizationEngine} from "@shapediver/viewer.features.attribute-visualization";
import {create} from "zustand";
import {devtools} from "zustand/middleware";

export const useShapeDiverStoreAttributeVisualization =
	create<IShapeDiverStoreAttributeVisualization>()(
		devtools(
			(set, get) => ({
				attributeVisualizationEngines: {},
				customAttributeData: {},
				updateCustomAttributeData: (
					attributeId: string,
					definition:
						| INumberAttributeCustomData
						| IDefaultAttributeCustomData,
				) => {
					const {customAttributeData} = get();
					set(
						(state) => ({
							customAttributeData: {
								...state.customAttributeData,
								[attributeId]: {
									...customAttributeData[attributeId],
									...definition,
								},
							},
						}),
						false,
						"updateCustomAttributeData",
					);
				},

				createAttributeVisualizationEngine: (viewport) => {
					const {attributeVisualizationEngines} = get();

					if (!attributeVisualizationEngines[viewport.id]) {
						// create the attribute visualization engine
						const attributeVisualizationEngine =
							new AttributeVisualizationEngine(viewport);

						set(
							(state) => ({
								attributeVisualizationEngines: {
									...state.attributeVisualizationEngines,
									[viewport.id]: attributeVisualizationEngine,
								},
							}),
							false,
							"createAttributeVisualizationEngine",
						);
					}
					return attributeVisualizationEngines[viewport.id];
				},

				closeAttributeVisualizationEngine(viewportId) {
					const {attributeVisualizationEngines} = get();
					if (attributeVisualizationEngines[viewportId]) {
						set(
							(state) => {
								const newAttributeVisualizationEngines = {
									...state.attributeVisualizationEngines,
								};
								delete newAttributeVisualizationEngines[
									viewportId
								];

								return {
									attributeVisualizationEngines:
										newAttributeVisualizationEngines,
								};
							},
							false,
							"closeAttributeVisualizationEngine",
						);
					}
				},
			}),
			{name: "ShapeDiverStoreAttributeVisualization"},
		),
	);
