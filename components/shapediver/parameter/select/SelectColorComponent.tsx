import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {Button, Flex, MantineThemeComponent, useProps} from "@mantine/core";
import React from "react";
import classes from "./SelectColorComponent.module.css";
import {
	SelectButtonStyleProps,
	SelectComponentProps,
	SelectFlexStyleProps,
} from "./SelectComponent";

interface StyleProps {
	buttonProps: SelectButtonStyleProps;
	flexProps: SelectFlexStyleProps;
}

export const defaultStyleProps: Partial<StyleProps> = {
	buttonProps: {
		variant: "filled",
	},
	flexProps: {gap: "xs", wrap: "wrap"},
};

type SelectColorComponentThemePropsType = Partial<StyleProps>;

export function SelectColorComponentThemeProps(
	props: SelectColorComponentThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

/**
 * Functional color select component.
 * Makes use of colored buttons aligned using a flex container to select an item.
 * @see https://mantine.dev/core/button
 * @see https://mantine.dev/core/flex/
 */
export default function SelectColorComponent(
	props: SelectComponentProps & SelectColorComponentThemePropsType,
) {
	const {
		onChange,
		items,
		itemData,
		disabled,
		value,
		settings,
		...styleProps
	} = props;

	// style properties
	const {buttonProps, flexProps} = useProps(
		"SelectColorComponent",
		defaultStyleProps,
		styleProps,
	);

	return (
		<Flex {...flexProps} {...settings?.flexProps}>
			{items.map((item) => {
				const data = itemData?.[item];
				const tooltip = data?.tooltip;

				const button = (
					<Button
						key={item}
						color={data?.color}
						onClick={() => onChange(item)}
						disabled={disabled}
						className={`${classes.btnColor} ${item === value ? classes.btnColorSelected : ""}`}
						{...buttonProps}
						{...settings?.buttonProps}
					/>
				);

				return tooltip ? (
					<TooltipWrapper key={item} label={tooltip}>
						{button}
					</TooltipWrapper>
				) : (
					button
				);
			})}
		</Flex>
	);
}
