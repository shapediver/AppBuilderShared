import BaseAttribute from "@AppBuilderShared/components/shapediver/appbuilder/widgets/attributes/BaseAttribute";
import {IColorAttribute} from "@shapediver/viewer.features.attribute-visualization";
import React from "react";

interface Props {
	name: string;
	attribute: IColorAttribute;
}

export default function ColorAttribute(props: Props) {
	const {name, attribute: attributeDefinition} = props;

	return (
		<BaseAttribute
			style={{display: "none"}}
			name={name}
			type={attributeDefinition.type}
		/>
	);
}
