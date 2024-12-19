import { IColorAttribute } from "@shapediver/viewer.features.attribute-visualization";
import React from "react";
import BaseAttribute from "./BaseAttribute";

interface Props {
	name: string;
	attribute: {
		typeHint: string;
	};
	updateAttribute: (attribute: IColorAttribute) => void;
	removeAttribute: (name: string) => void;
	changeOrder: (name: string, direction: "up" | "down") => void;
}

export default function ColorAttribute(props: Props) {
	const { name, removeAttribute, changeOrder } = props;

	return (
		<BaseAttribute 
			name={name} 
			removeAttribute={removeAttribute} 
			changeOrder={changeOrder} 
		/>
	);
}
