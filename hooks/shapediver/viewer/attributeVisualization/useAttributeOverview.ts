import {IAttributeVisualizationEngine} from "@shapediver/viewer.features.attribute-visualization";
import {ISDTFOverview} from "@shapediver/viewer.session";
import {useEffect, useState} from "react";

export const useAttributeOverview = (
	attributeVisualizationEngine?: IAttributeVisualizationEngine,
) => {
	const [attributeOverview, setAttributeOverview] = useState<
		ISDTFOverview | undefined
	>();
	/**
	 * Use effect that updates the attribute overview of the attribute visualization engine
	 */
	useEffect(() => {
		if (!attributeVisualizationEngine) return;
		setAttributeOverview(attributeVisualizationEngine.overview);

		const token = attributeVisualizationEngine.addListener(() => {
			if (!attributeVisualizationEngine) return;
			setAttributeOverview(attributeVisualizationEngine.overview);
		});

		return () => {
			if (token) attributeVisualizationEngine.removeListener(token);
		};
	}, [attributeVisualizationEngine]);

	return {attributeOverview};
};
