import BaseAttribute from "@AppBuilderShared/components/shapediver/appbuilder/widgets/attributes/BaseAttribute";
import {ColorInput} from "@mantine/core";
import {IDefaultAttribute} from "@shapediver/viewer.features.attribute-visualization";
import React, {useEffect, useState} from "react";

interface Props {
	name: string;
	attribute: Omit<IDefaultAttribute, "color"> &
		Partial<Pick<IDefaultAttribute, "color">>;
	updateColor: (color: string) => void;
}

export default function DefaultAttribute(props: Props) {
	const {attribute, name, updateColor} = props;

	const [color, setColor] = useState<string>(
		(attribute.color as string) || "#ffffff",
	);

	useEffect(() => {
		setColor(attribute.color as string);
	}, [attribute]);

	return (
		<BaseAttribute name={name} type={attribute.type}>
			<ColorInput
				placeholder="Pick color"
				value={color}
				onChangeEnd={(value) => {
					setColor(value);
					if (!value) return;
					updateColor(value);
				}}
			/>
		</BaseAttribute>
	);
}
