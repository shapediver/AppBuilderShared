import { ColorInput } from "@mantine/core";
import { IDefaultAttribute } from "@shapediver/viewer.features.attribute-visualization";
import { SDTF_TYPEHINT } from "@shapediver/viewer.session";
import React, { useEffect, useState } from "react";
import BaseAttribute from "./BaseAttribute";

interface Props {
    name: string;
    attribute: {
        typeHint: string;
    };
	updateAttribute: (attribute: IDefaultAttribute) => void;
	removeAttribute: (name: string) => void;
	changeOrder: (name: string, direction: "up" | "down") => void;
}

export default function DefaultAttribute(props: Props) {
	const { attribute: attributeDefinition, name, updateAttribute, removeAttribute, changeOrder } = props;

	const [attribute, setAttribute] = useState<IDefaultAttribute>({
		key: name,
		type: attributeDefinition.typeHint as SDTF_TYPEHINT,
		color: "fffffff"
	});

	useEffect(() => {
		updateAttribute(attribute);
	}, [attribute]);

	return (
		<BaseAttribute 
			name={name} 
			removeAttribute={removeAttribute} 
			changeOrder={changeOrder}>
			<ColorInput
				placeholder="Pick color"
				value={attribute.color as string}
				onChangeEnd={(value) => setAttribute({ ...attribute, color: value })}
			/>
		</BaseAttribute>
	);
}
