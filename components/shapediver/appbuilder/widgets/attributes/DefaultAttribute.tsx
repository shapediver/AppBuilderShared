import BaseAttribute from "@AppBuilderShared/components/shapediver/appbuilder/widgets/attributes/BaseAttribute";
import {useShapeDiverStoreAttributeVisualization} from "@AppBuilderShared/store/useShapeDiverStoreAttributeVisualization";
import {IDefaultAttributeCustomData} from "@AppBuilderShared/types/store/shapediverStoreAttributeVisualization";
import {ColorInput} from "@mantine/core";
import {IDefaultAttribute} from "@shapediver/viewer.features.attribute-visualization";
import React, {useEffect, useState} from "react";
import {useShallow} from "zustand/react/shallow";

export type IDefaultAttributeExtended = Omit<IDefaultAttribute, "color"> &
	Partial<Pick<IDefaultAttribute, "color">> &
	IDefaultAttributeCustomData;

interface Props {
	name: string;
	attribute: IDefaultAttributeExtended;
	updateColor: (color: string) => void;
}

export default function DefaultAttribute(props: Props) {
	const {attribute, name, updateColor} = props;
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
		const customValues = customAttributeData[
			name + "_" + attribute.type
		] as IDefaultAttributeExtended | undefined;

		if (attribute.customColor === undefined)
			attribute.customColor =
				customValues?.customColor || (attribute.color as string);

		setColor(attribute.customColor as string);
	}, [attribute]);

	const updateCustomColor = (color: string) => {
		setColor(color);
		updateColor(color);

		// Update the custom attribute data
		updateCustomAttributeData(name + "_" + attribute.type, {
			customColor: color,
		});
	};

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
