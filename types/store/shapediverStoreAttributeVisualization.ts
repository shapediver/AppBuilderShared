import {IAttributeVisualizationEngine} from "@shapediver/viewer.features.attribute-visualization";
import {IViewportApi} from "@shapediver/viewer.viewport";

export interface INumberAttributeCustomData {
	/**
	 * The custom number minimum value.
	 */
	customMin?: number;
	/**
	 * The custom number maximum value.
	 */
	customMax?: number;
}

export interface IDefaultAttributeCustomData {
	/**
	 * The custom color default value.
	 */
	customColor?: string;
}

export interface IShapeDiverStoreAttributeVisualization {
	/**
	 * Attribute visualization engines currently known by the store.
	 */
	attributeVisualizationEngines: {
		[viewportId: string]: IAttributeVisualizationEngine;
	};

	/**
	 * Custom attribute definitions currently known by the store.
	 */
	customAttributeData: {
		[widgetId: string]: {
			[attributeId: string]:
				| INumberAttributeCustomData
				| IDefaultAttributeCustomData;
		};
	};

	/**
	 * Update the custom attribute data for a specific widget and attribute.
	 *
	 * @param widgetId
	 * @param attributeId
	 * @param definition
	 * @returns
	 */
	updateCustomAttributeData: (
		widgetId: string,
		attributeId: string,
		definition: INumberAttributeCustomData | IDefaultAttributeCustomData,
	) => void;

	/**
	 * Create an attribute visualization engine for a viewport and add it to the store.
	 * @param viewportId
	 * @returns
	 */
	createAttributeVisualizationEngine: (
		viewport: IViewportApi,
	) => IAttributeVisualizationEngine | undefined;

	/**
	 * Close an attribute visualization engine and remove it from the store.
	 */
	closeAttributeVisualizationEngine: (viewportId: string) => void;
}
