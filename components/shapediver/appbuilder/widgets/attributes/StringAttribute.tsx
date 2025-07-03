import BaseAttribute from "@AppBuilderShared/components/shapediver/appbuilder/widgets/attributes/BaseAttribute";
import {
	Badge,
	BadgeProps,
	MantineThemeComponent,
	useProps,
} from "@mantine/core";
import {
	AttributeVisualizationUtils,
	isStringGradient,
	IStringAttribute,
	IStringGradient,
} from "@shapediver/viewer.features.attribute-visualization";
import {Converter, MaterialStandardData} from "@shapediver/viewer.session";
import React, {useMemo} from "react";

type StyleProps = {
	badgeProps?: Partial<BadgeProps>;
};

const defaultStyleProps: Partial<StyleProps> = {
	badgeProps: {
		style: {marginRight: "10px"},
	},
};

type StringAttributeThemePropsType = Partial<StyleProps>;

export function StringAttributeThemeProps(
	props: StyleProps,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}
interface Props {
	name: string;
	attribute: IStringAttribute;
	showLegend?: boolean;
}

export default function StringAttribute(
	props: Props & StringAttributeThemePropsType,
) {
	const {attribute, name, showLegend, ...rest} = props;

	const {badgeProps} = useProps("StringAttribute", defaultStyleProps, rest);

	const legend = useMemo(() => {
		const colorToValueDictionary: {
			[key: string]: {
				value: string;
				count: number;
			}[];
		} = {};

		attribute.values.forEach((item, index) => {
			if (typeof attribute.visualization === "string") {
				const data = AttributeVisualizationUtils.stringVisualization(
					item,
					attribute.values,
					attribute.visualization,
					"standard",
					new MaterialStandardData(),
				);
				const c = Converter.instance.toHexColor(data?.material.color);
				if (colorToValueDictionary[c] === undefined) {
					colorToValueDictionary[c] = [
						{
							value: item,
							count: attribute.countForValue[index],
						},
					];
				} else {
					const existingValue = colorToValueDictionary[c].find(
						(v) => v.value === item,
					);
					if (existingValue === undefined) {
						colorToValueDictionary[c].push({
							value: item,
							count: attribute.countForValue[index],
						});
					} else {
						existingValue.count += attribute.countForValue[index];
					}
				}
			} else if (isStringGradient(attribute.visualization)) {
				const gradient = attribute.visualization as IStringGradient;
				gradient.labelColors.map((color) => {
					if (color.values.includes(item)) {
						const c = Converter.instance.toHexColor(color.color);
						if (colorToValueDictionary[c] === undefined) {
							colorToValueDictionary[c] = [
								{
									value: item,
									count: attribute.countForValue[index],
								},
							];
						} else {
							const existingValue = colorToValueDictionary[
								c
							].find((v) => v.value === item);
							if (existingValue === undefined) {
								colorToValueDictionary[c].push({
									value: item,
									count: attribute.countForValue[index],
								});
							} else {
								existingValue.count +=
									attribute.countForValue[index];
							}
						}
					}
				});
			}
		});

		// create badge array
		return Object.entries(colorToValueDictionary)
			.map(([color, value], index) => {
				return value.map((v) => {
					return (
						<Badge
							{...badgeProps}
							autoContrast
							key={JSON.stringify(v) + index}
							color={color}
						>
							{v.count > 1
								? v.value + " (" + v.count + ")"
								: v.value}
						</Badge>
					);
				});
			})
			.flat();
	}, [attribute]);

	return (
		<BaseAttribute
			name={name}
			type={attribute.type}
			options={showLegend ? legend : undefined}
		></BaseAttribute>
	);
}
