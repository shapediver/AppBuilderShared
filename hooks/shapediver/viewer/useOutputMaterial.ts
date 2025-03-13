import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {
	GeometryData,
	IGeometryData,
	IMaterialAbstractData,
	IMaterialAbstractDataProperties,
	ITreeNode,
} from "@shapediver/viewer.session";
import {MaterialEngine} from "@shapediver/viewer.viewport";
import {useCallback, useEffect, useRef} from "react";

/**
 * We traverse the node and all its children, and collect all geometry data.
 * Within the geometry data, the material property can then be updated.
 *
 * @param node
 * @returns
 */
const getGeometryData = (node: ITreeNode): IGeometryData[] => {
	const geometryData: IGeometryData[] = [];
	node.traverseData((data) => {
		if (data instanceof GeometryData) {
			geometryData.push(data);
		}
	});

	return geometryData;
};

/**
 * We keep track of the original materials, so that we can restore them if the node to
 * which the material is applied changes.
 * This object is keyed by ITreeNode.id and IGeometryData.id
 */
const originalMaterials: {
	[key: string]: {[key: string]: IMaterialAbstractData | null};
} = {};

/**
 * Hook allowing to update the material of an output.
 *
 * @param sessionId
 * @param outputId
 * @param materialProperties
 */
export function useOutputMaterial(
	sessionId: string,
	outputId: string,
	materialProperties: IMaterialAbstractDataProperties,
) {
	const materialRef = useRef<IMaterialAbstractData | null>(null);
	const {addOutputUpdateCallback} = useShapeDiverStoreSession();

	// callback which will be executed on update of the output node
	const callback = useCallback((newNode?: ITreeNode, oldNode?: ITreeNode) => {
		// restore original materials if there is an old node (a node to be replaced)
		// TODO test this again once https://shapediver.atlassian.net/browse/SS-7366 is fixed
		if (oldNode && originalMaterials[oldNode.id]) {
			const geometryData = getGeometryData(oldNode);

			geometryData.forEach((data) => {
				const originalMaterial = originalMaterials[oldNode.id][data.id];
				if (originalMaterial) {
					data.material = originalMaterial;
					data.updateVersion();
				}
			});

			delete originalMaterials[oldNode.id];

			oldNode.updateVersion();
		}

		// create and set the new material if there is a new node
		if (newNode) {
			const geometryData = getGeometryData(newNode);

			// backup original materials
			if (!originalMaterials[newNode.id]) {
				originalMaterials[newNode.id] = {};
				geometryData.forEach((data) => {
					originalMaterials[newNode.id][data.id] = data.material;
				});
			}

			geometryData.forEach((data) => {
				data.material = materialRef.current;
				data.updateVersion();
			});

			newNode.updateVersion();
		}
	}, []);

	useEffect(() => {
		const removeOutputUpdateCallback = addOutputUpdateCallback(
			sessionId,
			outputId,
			callback,
		);

		return removeOutputUpdateCallback;
	}, [sessionId, outputId, callback]);

	// use an effect to apply changes to the material, and to apply the callback once the node is available
	useEffect(() => {
		if (materialProperties) {
			materialRef.current =
				MaterialEngine.instance.createMaterialData(materialProperties);
		} else {
			materialRef.current = null;
		}
	}, [materialProperties]);
}
