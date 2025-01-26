import { IColorAttribute } from "@shapediver/viewer.features.attribute-visualization";
import React from "react";
import BaseAttribute from "@AppBuilderShared/components/shapediver/appbuilder/widgets/attributes/BaseAttribute";

interface Props {
	name: string;
	attribute: {
		typeHint: string;
	};
	updateAttribute: (attribute: IColorAttribute) => void;
	removeAttribute: (name: string, type: string) => void;
	changeOrder: (name: string, type: string, direction: "up" | "down") => void;
}

export default function ColorAttribute(props: Props) {
	const { name, attribute: attributeDefinition, removeAttribute, changeOrder } = props;

	return (
		<BaseAttribute
			name={name}
			type={attributeDefinition.typeHint}
			removeAttribute={removeAttribute}
			changeOrder={changeOrder}
		/>
	);
}
