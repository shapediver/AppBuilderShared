import BaseAttribute from "@AppBuilderShared/components/shapediver/appbuilder/widgets/attributes/BaseAttribute";
import {useShapeDiverStoreAttributeVisualization} from "@AppBuilderShared/store/useShapeDiverStoreAttributeVisualization";
import {IDefaultAttributeCustomData} from "@AppBuilderShared/types/store/shapediverStoreAttributeVisualization";
import {ColorInput} from "@mantine/core";
import {IDefaultAttribute} from "@shapediver/viewer.features.attribute-visualization";
import React, {useCallback, useEffect, useState} from "react";
import {useShallow} from "zustand/react/shallow";

export type IDefaultAttributeExtended = Omit<IDefaultAttribute, "color"> &
	Partial<Pick<IDefaultAttribute, "color">> &
	IDefaultAttributeCustomData;

interface Props {
	widgetId: string;
	name: string;
	attribute: IDefaultAttributeExtended;
	updateColor: (color: string) => void;
}

export default function DefaultAttribute(props: Props) {
	const {widgetId, attribute, name, updateColor} = props;
	const {updateCustomAttributeData, customAttributeData} =
		useShapeDiverStoreAttributeVisualization(
			useShallow((state) => ({
				updateCustomAttributeData: state.updateCustomAttributeData,
				customAttributeData: state.customAttributeData,
			})),
		);

	const [color, setColor] = useState<string>(
		(attribute.color as string) || "#ffffff",
	);

	useEffect(() => {
		// Get the custom attribute data
		const widgetData = customAttributeData[widgetId];
		const customValues = widgetData?.[name + "_" + attribute.type] as
			| IDefaultAttributeExtended
			| undefined;

		if (attribute.customColor === undefined)
			attribute.customColor =
				customValues?.customColor || (attribute.color as string);

		setColor(attribute.customColor as string);
	}, [widgetId, attribute]);

	const updateCustomColor = useCallback(
		(color: string) => {
			setColor(color);
			updateColor(color);

			// Update the custom attribute data
			updateCustomAttributeData(widgetId, name + "_" + attribute.type, {
				customColor: color,
			});
		},
		[widgetId, attribute],
	);

	return (
		<BaseAttribute name={name} type={attribute.type}>
			<ColorInput
				placeholder="Pick color"
				value={color}
				onChangeEnd={updateCustomColor}
			/>
		</BaseAttribute>
	);
}
